export const publicStaticContent = {
  home: {
    heroTags: ['All', 'Engineering', 'Laravel', 'Design', 'Workflow'],
    quickMetrics: [
      { icon: 'schedule', label: '5 min read' },
      { icon: 'visibility', label: '850' },
      { icon: 'mode_comment', label: '12' },
      { icon: 'thumb_up', label: '92' },
    ],
  },
  about: {
    intro:
      'TechHumana style front surface rebuilt in Vue. Existing article API stays real; editorial profile, interests, and showcase blocks remain static until backend supports them.',
    profile: {
      title: 'TechHumana',
      summary: 'Analog precision in digital code.',
      description:
        'This page uses static presentation blocks to mirror approved HTML while preserving current router and auth flow.',
    },
    stacks: ['UI/UX Design', 'Frontend Development', 'Neumorphism', 'Tailwind-inspired Layouts', 'Interaction Design'],
    interests: [
      { icon: 'book', label: 'Long-form writing and editorial systems' },
      { icon: 'camera', label: 'Visual references and interface snapshots' },
      { icon: 'coffee', label: 'Calm workflows and focused sessions' },
    ],
    sections: [
      {
        title: 'Editorial Focus',
        body: 'Article reading, browsing, and sign-in continue to use live project logic. Decorative surfaces, social blocks, and profile storytelling stay static for now.',
      },
      {
        title: 'Design Direction',
        body: 'Warm neutrals, raised cards, rounded controls, and drawer-based navigation intentionally follow the approved static references.',
      },
    ],
    contactMethods: [
      { icon: 'mail', label: 'Email', value: "editorial{'@'}demo.invalid" },
      { icon: 'work', label: 'LinkedIn', value: 'Static profile link' },
      { icon: 'chat', label: 'Community', value: 'Reply window in 2 business days' },
    ],
  },
  contact: {
    intro:
      'Static contact surface for this release. Form fields are present for layout fidelity and do not submit anywhere yet.',
    methods: [
      { icon: 'mail', label: 'Email', value: "hello{'@'}techhumana.example" },
      { icon: 'schedule', label: 'Office Hours', value: 'Mon-Fri 10:00-18:00' },
      { icon: 'send', label: 'Response Window', value: 'Within two business days' },
    ],
  },
  articleSidebar: {
    filters: ['All Posts', 'Engineering', 'Laravel', 'Design', 'Productivity'],
    sortOptions: ['Latest', 'Popular'],
  },
  postDetail: {
    toc: [
      { id: 'intro', label: 'Introduction' },
      { id: 'core', label: 'Core Idea' },
      { id: 'design', label: 'Design Translation' },
      { id: 'conclusion', label: 'Conclusion' },
    ],
    tags: ['UX Design', 'Productivity'],
    stats: [
      { icon: 'visibility', label: '1.2k' },
      { icon: 'chat_bubble', label: '24' },
      { icon: 'thumb_up', label: '156' },
      { icon: 'thumb_down', label: '8' },
    ],
    actions: [
      { icon: 'share', label: 'Share' },
      { icon: 'bookmark', label: 'Save' },
      { icon: 'favorite', label: 'Like' },
    ],
    related: [
      {
        title: 'Design systems with softer edges',
        category: 'Design Systems',
        excerpt: 'Static related card used until a dedicated recommendation API exists.',
      },
      {
        title: 'Typography choices for warm interfaces',
        category: 'Typography',
        excerpt: 'Serif headlines and compact sans UI create the approved editorial contrast.',
      },
      {
        title: 'CSS tokens behind the public rebuild',
        category: 'Engineering',
        excerpt: 'New front theme selectors sit alongside existing admin and editor styling.',
      },
    ],
    comments: [
      {
        author: 'Alex',
        date: '2026-05-13',
        body: 'Strong layout direction. Keeping real article data while replacing the whole public shell is the right tradeoff.',
      },
      {
        author: 'Mina',
        date: '2026-05-14',
        body: 'The warm neomorphic treatment now feels intentional instead of generic card UI.',
      },
    ],
  },
} as const
