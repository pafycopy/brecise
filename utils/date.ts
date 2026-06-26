export const generateDays = (startDate: Date, total = 5) => {
  const days = [];

  for (let i = 0; i < total; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);

    days.push({
      day: d
        .toLocaleDateString("en-US", { weekday: "short" })
        .toUpperCase(),
      date: d.getDate(),
      fullDate: d,
    });
  }

  return days;
};