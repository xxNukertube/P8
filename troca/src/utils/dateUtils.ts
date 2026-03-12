export const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

export const calculateEndDateTime = (startDateStr: string, startTimeStr: string, duracao: string) => {
  if (!startDateStr || !startTimeStr || duracao === 'Personalizado') {
    return { endDateStr: startDateStr, endTimeStr: '' };
  }
  const [hoursStr, minutesStr] = startTimeStr.split(':');
  let hours = parseInt(hoursStr, 10);
  let minutes = parseInt(minutesStr, 10);

  let durationHours = 0;
  if (duracao === '6h') durationHours = 6;
  else if (duracao === '12h') durationHours = 12;
  else if (duracao === '24h') durationHours = 24;
  else if (duracao === '48h') durationHours = 48;

  hours += durationHours;
  const days = Math.floor(hours / 24);
  hours = hours % 24;

  const formattedHours = hours.toString().padStart(2, '0');
  const formattedMinutes = minutes.toString().padStart(2, '0');
  const endTimeStr = `${formattedHours}:${formattedMinutes}`;

  const [year, month, day] = startDateStr.split('-');
  const startDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  startDate.setDate(startDate.getDate() + days);

  const tYear = startDate.getFullYear();
  const tMonth = (startDate.getMonth() + 1).toString().padStart(2, '0');
  const tDay = startDate.getDate().toString().padStart(2, '0');
  const endDateStr = `${tYear}-${tMonth}-${tDay}`;

  return { endDateStr, endTimeStr };
};

export const formatPeriodText = (startDateStr: string, startTimeStr: string, endDateStr: string, endTimeStr: string) => {
  if (!startDateStr) return '';
  const startFormatted = formatDate(startDateStr);
  const endFormatted = formatDate(endDateStr);

  if (startDateStr === endDateStr || !endDateStr) {
    return `das ${startTimeStr} às ${endTimeStr} do dia ${startFormatted}`;
  } else {
    return `das ${startTimeStr} do dia ${startFormatted} às ${endTimeStr} do dia ${endFormatted}`;
  }
};
