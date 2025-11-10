export const pingHandler = (commands) => {
  if (commands.length > 2) {
    return new Error("ERR wrong number of arguments for 'ping' command");
  } else if (commands.length === 2) {
    return `${commands[1]}`;
  } else {
    return "PONG";
  }
};
