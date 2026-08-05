// Netlify Function: get-cars-public
// Public version: returns cars.json content without requiring authentication

const OWNER = process.env.GITHUB_OWNER;
const REPO = process.env.GITHUB_REPO;
const BRANCH = process.env.GITHUB_BRANCH || 'main';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

function respond(status, body){
  return { statusCode: status, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

exports.handler = async function(event, context){
  if(event.httpMethod !== 'GET') return respond(405, { error: 'Method Not Allowed' });

  // pick fetch runtime
  let fetchFn = null;
  if(typeof fetch !== 'undefined') fetchFn = fetch;
  else {
    try{ fetchFn = require('node-fetch'); }catch(e){ /* ignore */ }
  }
  if(!fetchFn) return respond(500, { error: 'Runtime missing fetch' });

  const filePath = 'cars.json';
  const getUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}?ref=${BRANCH}`;
  try{
    const getRes = await fetchFn(getUrl, { headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}`, 'User-Agent': 'Netlify-Function' } });
    if(getRes.status === 404) return respond(200, { cars: [] });
    if(getRes.status >= 400){ const txt = await getRes.text(); return respond(500, { error: 'Failed to fetch cars.json', details: txt }); }
    const data = await getRes.json();
    const decoded = Buffer.from(data.content, 'base64').toString();
    const obj = JSON.parse(decoded);
    return respond(200, obj);
  }catch(err){ return respond(500, { error: 'Error fetching cars.json', details: String(err) }); }
};
