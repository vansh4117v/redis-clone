export const parseRESP = (data) => {
  const commands = data.toString().split("\r\n");
  const result = [];
  if (!commands[0].startsWith("*")) return result;
  const commandCount = parseInt(commands[0].slice(1));

  let i = 1;
  while (result.length < commandCount) {
    const lenLine = parseInt(commands[i++].slice(1));
    if (lenLine) {
      const command = commands[i++].substring(0, lenLine);
      result.push(command);
    }
  }
  return result;
};
