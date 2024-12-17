export function generateCustomName(baseName: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // Months are 0-based in JavaScript
  const day = now.getDate();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  // Ensure each part of the date and time has a leading zero if necessary
  const paddedMonth = month < 10 ? "0" + month : month;
  const paddedDay = day < 10 ? "0" + day : day;
  const paddedHours = hours < 10 ? "0" + hours : hours;
  const paddedMinutes = minutes < 10 ? "0" + minutes : minutes;
  const paddedSeconds = seconds < 10 ? "0" + seconds : seconds;

  const timestamp = `${year}${paddedMonth}${paddedDay}${paddedHours}${paddedMinutes}${paddedSeconds}`;
  const split = baseName.split(".");
  split.pop();

  return `${split.join(".")}_${timestamp}`;
}
