import { generatePostWithClaude } from './api.js';

async function generatePost(prompt, category, userSettings) {
    try {
        const generatedPost = await generatePostWithClaude(prompt, category, userSettings);
        return generatedPost;
    } catch (error) {
        console.error('Error generating post:', error);
        throw error;
    }
}

export { generatePost };