export const publicStaticContent = {
  about: {
    sections: [
      {
        title: 'Editorial Focus',
        body: 'This public surface keeps article reading connected to the real posts API while non-core presentation sections remain front-end only.',
      },
      {
        title: 'Design Direction',
        body: 'The current static pages anchor the visual system so the app can align to approved HTML references without changing backend contracts.',
      },
    ],
  },
  contact: {
    methods: [
      { label: 'Email', value: "editorial{'@'}demo.invalid" },
      { label: 'Office Hours', value: 'Mon-Fri 10:00-18:00' },
      { label: 'Response Window', value: 'Replies usually land within two business days.' },
    ],
  },
  articleSidebar: {
    lenses: ['All Stories', 'Design', 'Product', 'Engineering'],
  },
} as const
