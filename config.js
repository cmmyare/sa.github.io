// Where the backend API lives. The page tries each URL in order until one works,
// so if one host is blocked on her network the next one is used.
window.MEET_API_URLS =
  location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? ['http://localhost:3000']
    : [
        'https://meet-sab-api.netlify.app', // main backend (Netlify)
        'https://meet-sab-api.vercel.app', // backup backend (Vercel)
      ];
