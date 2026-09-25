export async function readOllamaStream(response) {
  if (!response.body) throw new Error("Ollama 응답 스트림이 없습니다.");
  const decoder = new TextDecoder();
  let buffered = "";
  let content = "";
  let result;
  let receivedBytes = 0;
  const consume = (line) => {
    if (!line.trim()) return;
    if (result) throw new Error("완료 후 추가 응답을 받았습니다.");
    const part = JSON.parse(line);
    if (part.error) throw new Error("Ollama 스트림 오류가 발생했습니다.");
    content += part.message?.content || "";
    if (part.done === true) result = part;
  };
  for await (const chunk of response.body) {
    receivedBytes += chunk.byteLength;
    if (receivedBytes > 4_000_000)
      throw new Error("Ollama 응답 크기 한도를 초과했습니다.");
    buffered += decoder.decode(chunk, { stream: true });
    const lines = buffered.split("\n");
    buffered = lines.pop();
    for (const line of lines) consume(line);
  }
  consume(buffered + decoder.decode());
  if (!result) throw new Error("Ollama 스트림이 완료 전에 종료됐습니다.");
  return { ...result, message: { content } };
}
