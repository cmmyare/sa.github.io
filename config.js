// Where the backend API lives.
// Local testing  -> http://localhost:3000
// After deploying the server on Vercel, put its URL below.
window.MEET_API_URL =
  location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://meet-sab-api.vercel.app'; // <-- your Vercel backend URL
