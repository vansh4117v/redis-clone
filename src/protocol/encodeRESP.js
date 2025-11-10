export const encodeRESP = (data) => {
  if (typeof data === "string") {
    return `+${data}\r\n`;
  }
  else if (typeof data === "number") {
    return `:${data}\r\n`;
  }
  else if (Array.isArray(data)) {
    let resp = `*${data.length}\r\n`;
    for (const item of data) {
      resp += encodeRESP(item);
    }
    return resp;
  }
  else if (data === null) {
    return `$-1\r\n`;
  }
  else if (data instanceof Error) {
    return `-${data.message}\r\n`;
  }
  else {
    const strData = String(data);
    return `$${Buffer.byteLength(strData)}\r\n${strData}\r\n`;
  }
};
