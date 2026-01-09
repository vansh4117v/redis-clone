export const parseRESP = (data: Buffer): string[][] => {
  const rawCommandsArray = data.toString().split("\r\n");

  const commandsArray: string[][] = [];
  let i = 0;

  while (i < rawCommandsArray.length) {
    if (rawCommandsArray[i].startsWith("*")) {
      const numberOfElements = parseInt(rawCommandsArray[i].substring(1));
      const command: string[] = [];
      i++;
      for (let j = 0; j < numberOfElements; j++) {
        if (rawCommandsArray[i]?.startsWith("$")) {
          const lengthOfElement = parseInt(rawCommandsArray[i].substring(1));
          i++;
          if (i < rawCommandsArray.length) {
            command.push(rawCommandsArray[i].substring(0, lengthOfElement));
          }
          i++;
        } else {
          console.error("Invalid RESP format at index", i);
          i++;
        }
      }
      if (command.length > 0) {
        commandsArray.push(command);
      }
    } else if (rawCommandsArray[i] === "") {
      i++;
    } else {
      console.error("Unexpected RESP data:", rawCommandsArray[i]);
      i++;
    }
  }
  return commandsArray;
};
