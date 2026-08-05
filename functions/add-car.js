// Netlify Function: add-car
// Expects POST with JSON body { title, price, year, mileage, location, description, whatsapp, status, images: [url, ...] }
// Authorization: Bearer <netlify-id-token> header must be present (JWT from netlify-identity)

const OWNER = process.env.GITHUB_OWNER;
const REPO = process.env.GITHUB_REPO;
const BRANCH = process.env.GITHUB_BRANCH || 'main';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const SITE_URL = process.env.SITE_URL; // e.g. https://car-catalog-dnd.netlify.app

if(!OWNER || !REPO || !GITHUB_TOKEN || !SITE_URL){
  console.error('Missing required env vars: GITHUB_OWNER, GITHUB_REPO, GITHUB_TOKEN, SITE_URL');
}

function respond(status, body){
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  };
}

exports.handler = async function(event, context) {
  if(event.httpMethod !== 'POST') return respond(405, { error: 'Method Not Allowed' });

  // pick a fetch implementation at runtime (prefer global fetch on Node 18+)
  let fetchFn = null;
  if(typeof fetch !== 'undefined') fetchFn = fetch;
  else {
    try{
      // require at runtime only (avoid ImportModuleError at module load)
      fetchFn = require('node-fetch');
    }catch(e){
      console.error('Runtime has no global fetch and node-fetch is not installed');
    }
  }
  if(!fetchFn) return respond(500, { error: 'Runtime missing fetch. Please use Node 18+ runtime or install node-fetch in functions package.json' });

  const auth = (event.headers && (event.headers.authorization || event.headers.Authorization)) || '';
  if(!auth || !auth.startsWith('Bearer ')) return respond(401, { error: 'Missing Authorization header (Bearer token expected)' });
  const idToken = auth.replace(/^Bearer\s+/, '');

  // Verify identity token by calling Netlify Identity endpoint
  try{
    const userRes = await fetchFn(`${SITE_URL}/.netlify/identity/user`, {
      headers: { 'Authorization': `Bearer ${idToken}` }
    });
    if(userRes.status !== 200){
      const txt = await userRes.text();
      console.error('Identity verification failed', userRes.status, txt);
      return respond(401, { error: 'Identity verification failed', details: txt });
    }
    var user = await userRes.json();
  }catch(err){
    console.error('Error verifying identity', err);
    return respond(500, { error: 'Error verifying identity', details: String(err) });
  }

  let payload;
  try{ payload = JSON.parse(event.body); }catch(e){ return respond(400, { error: 'Invalid JSON body' }); }

  const { title, price, year, mileage, location, description, whatsapp, status, images } = payload;
  if(!title) return respond(400, { error: 'Missing required field: title' });

  // Fetch current cars.json from GitHub
  const filePath = 'cars.json';
  const getUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}?ref=${BRANCH}`;
  let currentContent, sha;
  try{
    const getRes = await fetchFn(getUrl, { headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'User-Agent': 'Netlify-Function' } });
    if(getRes.status === 404){
      // create new structure
      currentContent = { cars: [] };
      sha = null;
    } else if(getRes.status >= 400){
      const txt = await getRes.text();
      console.error('Failed to fetch cars.json', getRes.status, txt);
      return respond(500, { error: 'Failed to fetch cars.json', details: txt });
    } else {
      const data = await getRes.json();
      sha = data.sha;
      const decoded = Buffer.from(data.content, 'base64').toString();
      currentContent = JSON.parse(decoded);
    }
  }catch(err){
    console.error('Error fetching cars.json', err);
    return respond(500, { error: 'Error fetching cars.json', details: String(err) });
  }

  // Normalize existing array
  const carsArray = Array.isArray(currentContent) ? currentContent : (currentContent.cars || []);

  // Create new car object
  const newCar = {
    id: String(Date.now()),
    title,
    price: price || null,
    year: year || null,
    mileage: mileage || null,
    location: location || null,
    description: description || null,
    whatsapp: whatsapp || null,
    status: status || 'available',
    images: Array.isArray(images) ? images : (images ? [images] : []) ,
    created_at: new Date().toISOString(),
    created_by: { id: user.id, email: user.email }
  };

  carsArray.push(newCar);

  const newContentObj = { cars: carsArray };
  const newContentStr = JSON.stringify(newContentObj, null, 2);
  const newContentBase64 = Buffer.from(newContentStr).toString('base64');

  // Prepare commit
  const putUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}`;
  const commitMessage = `Add car: ${newCar.title} (by ${user.email})`;
  const body = {
    message: commitMessage,
    content: newContentBase64,
    branch: BRANCH
  };
  if(sha) body.sha = sha;

  try{
    const putRes = await fetchFn(putUrl, {
      method: 'PUT',
      headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'User-Agent': 'Netlify-Function', 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const putData = await putRes.json();
    if(putRes.status >= 400){
      console.error('Failed to commit cars.json', putRes.status, putData);
      return respond(500, { error: 'Failed to commit cars.json', details: putData });
    }
    return respond(200, { ok: true, commit: putData.commit, car: newCar });
  }catch(err){
    console.error('Error committing cars.json', err);
    return respond(500, { error: 'Error committing cars.json', details: String(err) });
  }
};
