export const en = {
  common: {
    appName:  'TEC',
    tagline:  'The Elite Consortium',
    login:    'Sign in with Pi',
    logout:   'Logout',
    loading:  'Loading...',
    comingSoon: 'Coming Soon',
    live:     'Live',
  },
  dashboard: {
    greeting:   'Welcome,',
    welcomeNew: '🎉 Welcome to TEC — Your account is ready',
    stats: {
      piBalance:     'Pi Balance',
      tecWallet:     'TEC Wallet',
      availableApps: 'Available Apps',
      activeApp:     'Active',
      subscription:  'Subscription',
      upgradePro:    'Upgrade to Pro',
    },
    appsTitle: 'TEC Ecosystem',
    appsCount: '24 Apps',
  },
  epic: {
    brand:   'TEC Epic',
    // C19 — "no session" and "signed in, but the backend did not answer" are
    // different states; both used to say "Sign in with Pi".
    loadState: {
      signedOutTitle: 'No projects yet',
      signedOut:      'Sign in with Pi to see the projects you\'re building. Create one to start the Epic → Zone → activity → Legend journey — it appears here once you do.',
      downTitle:      'Couldn\'t load your projects',
      down:           'You\'re signed in, but Epic didn\'t answer just now. Try again in a moment — nothing is shown rather than a guess.',
    },
    tagline: 'Where the Pi economy builds new things. What are you building?',
    nav: { home: 'Home', projects: 'Projects', pro: 'Pro', settings: 'Settings' },
    projects: 'Projects',
    upgrade: 'Upgrade',
    discover: '🧭 Discover public Pi projects →',
    settings: {
      profile: 'Profile', planFree: 'Free', planPro: 'Pro',
      connectedPi: 'Connected to Pi', notSignedIn: 'Not signed in', member: 'TEC Member',
      appearance: 'Appearance', language: 'Language', languageDesc: 'Display language',
      about: 'About', version: 'Version', domain: 'Domain', ecosystem: 'Ecosystem',
      builtOn: 'Built on', builtOnPi: 'Pi Network', logout: 'Logout',
    },
  },
};
