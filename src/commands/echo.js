export const echoHandler = (commands) => {
  if (commands.length !== 2) {
    return new Error("ERR wrong number of arguments for 'echo' command");
  } else {
    return `${commands[1]}`;
  }
};
