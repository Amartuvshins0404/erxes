export const notifications = {
  plugin: 'event',

  modules: [
    {
      name: 'event',
      description: 'Events',
      icon: 'IconCalendarEvent',

      events: [
        {
          name: 'newEvent',
          title: 'New event published',
          description: 'Triggered when an event is published to members',
        },
        {
          name: 'eventReminder',
          title: 'Event reminder',
          description: 'Triggered ahead of an event the member is attending',
        },
      ],
    },
  ],
};
