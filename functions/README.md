Netlify Functions + Admin Upload

Files added:
- functions/add-car.js        (Netlify Function to add a car into cars.json using GitHub API)
- admin/upload.html          (Simple admin page: login (Netlify Identity), upload images to Cloudinary, submit metadata)

Environment variables required (set in Netlify site settings -> Build & deploy -> Environment):
- GITHUB_TOKEN               (GitHub Personal Access Token with repo permissions)
- GITHUB_OWNER               (GitHub username or org owning the repo, e.g. JieeZiee)
- GITHUB_REPO                (Repository name, e.g. Car-Catalog)
- GITHUB_BRANCH              (Branch to commit to, default: main)
- SITE_URL                   (Site URL, e.g. https://car-catalog-dnd.netlify.app)
- CLOUDINARY_CLOUD_NAME      (Cloudinary cloud name)
- CLOUDINARY_UPLOAD_PRESET   (Cloudinary unsigned upload preset name)

Instructions (summary):
1. Create a GitHub Personal Access Token (classic) with scope `repo` or at least `repo:contents`.
2. In Netlify -> Site -> Settings -> Build & deploy -> Environment, add the vars above. Do NOT commit tokens to repo.
3. Create Cloudinary account (free) and an unsigned upload preset. Note the cloud name and preset.
4. Set Identity Registration in Netlify to "Open" so users can Sign up, or use Invite-only and invite specific users.
5. After environment vars are set, open https://<your-site>/admin/upload.html to log in and upload.

Security & notes:
- The function verifies the Netlify Identity JWT by calling SITE_URL/.netlify/identity/user so only authenticated users can call the function.
- The function currently accepts any authenticated user. To restrict, uncomment role checks in functions/add-car.js and set user roles via Netlify Identity -> Manage users.
- Uploaded images are stored in Cloudinary (recommended) to avoid inflating the git repository size.

Testing:
- Sign up / Log in at /admin/upload.html
- Upload one or more images and fill metadata -> Submit
- Check GitHub repo for new commit modifying cars.json
- Wait for Netlify deploy and verify listing appears on site

If you want, I can now:
- Provide exact step-by-step screenshots for creating GitHub PAT & Cloudinary preset
- Adjust function to also commit images into repo instead of Cloudinary (not recommended)

