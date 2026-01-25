export interface CalendarEvent {
  title: string;
  description: string;
  location?: string;
  startDate: Date;
  endDate: Date;
  organizer?: {
    name: string;
    email: string;
  };
}

function formatICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

export function generateICSContent(event: CalendarEvent): string {
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}@inspectra.fr`;
  const now = formatICSDate(new Date());
  const start = formatICSDate(event.startDate);
  const end = formatICSDate(event.endDate);

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Inspectra//Maintenance//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeICSText(event.title)}`,
    `DESCRIPTION:${escapeICSText(event.description)}`,
  ];

  if (event.location) {
    icsContent.push(`LOCATION:${escapeICSText(event.location)}`);
  }

  if (event.organizer) {
    icsContent.push(`ORGANIZER;CN=${escapeICSText(event.organizer.name)}:mailto:${event.organizer.email}`);
  }

  icsContent.push(
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Rappel intervention',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  );

  return icsContent.join('\r\n');
}

export function generateOutlookWebUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    subject: event.title,
    body: event.description,
    startdt: event.startDate.toISOString(),
    enddt: event.endDate.toISOString(),
    location: event.location || '',
    path: '/calendar/action/compose',
    rru: 'addevent',
  });

  return `https://outlook.office.com/calendar/0/deeplink/compose?${params.toString()}`;
}

export function generateGoogleCalendarUrl(event: CalendarEvent): string {
  const formatGoogleDate = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    details: event.description,
    dates: `${formatGoogleDate(event.startDate)}/${formatGoogleDate(event.endDate)}`,
    location: event.location || '',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function generateCalendarInviteData(params: {
  assetDesignation: string;
  operationType: string;
  date: string;
  description: string;
  technicianName: string;
  siteName?: string;
}): {
  icsContent: string;
  outlookUrl: string;
  googleUrl: string;
} {
  const operationLabels: Record<string, string> = {
    'MAINTENANCE': 'Maintenance',
    'INSPECTION': 'Inspection',
    'REPARATION': 'Réparation',
    'MODIFICATION': 'Modification',
  };

  const startDate = new Date(params.date);
  startDate.setHours(9, 0, 0, 0);
  
  const endDate = new Date(params.date);
  endDate.setHours(12, 0, 0, 0);

  const event: CalendarEvent = {
    title: `${operationLabels[params.operationType] || params.operationType} - ${params.assetDesignation}`,
    description: `Intervention assignée à ${params.technicianName}\n\n${params.description}`,
    location: params.siteName,
    startDate,
    endDate,
    organizer: {
      name: 'Inspectra',
      email: 'noreply@inspectra.fr',
    },
  };

  return {
    icsContent: generateICSContent(event),
    outlookUrl: generateOutlookWebUrl(event),
    googleUrl: generateGoogleCalendarUrl(event),
  };
}
