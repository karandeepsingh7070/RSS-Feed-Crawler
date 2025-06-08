let answerPipeline = null;

async function generateAnswer(prompt, maxTokens = 1000) {
  if (!answerPipeline) {
    const { pipeline } = await import('@xenova/transformers');
    answerPipeline = await pipeline('text2text-generation', 'Xenova/distilbart-cnn-12-6');
  }

  const result = await answerPipeline(prompt, {
    max_new_tokens: maxTokens,
  });

  return result;
}

module.exports = { generateAnswer };