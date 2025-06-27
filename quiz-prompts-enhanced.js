// Enhanced Quiz Generation Prompts for Better Educational Questions

export const QUIZ_GENERATION_PROMPTS = {
    // Main prompt template for generating engaging quiz questions
    generateQuizPrompt: (courseName, courseDetails, questionCount = 10) => `
You are creating an engaging, educational quiz for "${courseName}". 

Course Details:
${courseDetails}

Create ${questionCount} multiple-choice questions that:

1. **Question Style**:
   - Start with interesting scenarios or "what if" questions when possible
   - Use concrete examples and real-world applications
   - Include creative comparisons or analogies
   - Make learners think critically, not just recall facts
   - Occasionally use humor or surprising connections

2. **Answer Options**:
   - Create 4 plausible options for each question
   - Include common misconceptions as wrong answers
   - Make wrong answers educational (learners learn even from mistakes)
   - Avoid "all of the above" or "none of the above"
   - Ensure options are similar in length and complexity

3. **Educational Value**:
   - Test understanding of concepts, not memorization
   - Progress from basic to advanced concepts
   - Include application-based questions
   - Cover different aspects of the topic

4. **Engagement**:
   - Use scenarios that relate to learners' experiences
   - Include "What would happen if..." questions
   - Ask about best practices and common pitfalls
   - Make questions that spark curiosity

Example format:
{
    "text": "If you needed to explain [concept] to a 5-year-old, which analogy would work best?",
    "answers": [
        "It's like a recipe where each ingredient must be added in order",
        "It's like a puzzle where pieces must fit together perfectly",
        "It's like a story that must be told from beginning to end",
        "It's like a game where you level up by learning new skills"
    ],
    "correct": 0,
    "explanation": "This analogy works because [reasoning]"
}

Return as a JSON array with ${questionCount} questions.`,

    // Specific prompt templates for different question types
    scenarioQuestion: (topic) => `Create a scenario-based question about ${topic} that starts with "Imagine you're..." or "What would happen if..."`,
    
    analogyQuestion: (topic) => `Create a question that uses an everyday analogy to explain ${topic}`,
    
    troubleshootingQuestion: (topic) => `Create a question about common mistakes or troubleshooting issues with ${topic}`,
    
    bestPracticeQuestion: (topic) => `Create a question about best practices or optimal approaches for ${topic}`,
    
    // Feedback messages for quiz takers
    correctFeedback: [
        "Brilliant! You nailed it! 🌟",
        "Exactly right! You're on fire! 🔥",
        "Perfect! Your understanding is stellar! ⭐",
        "Wonderful! You've mastered this concept! 🎯",
        "Outstanding! Keep up the great work! 🚀"
    ],
    
    incorrectFeedback: [
        "Not quite, but great attempt! Let's learn from this.",
        "Close! The correct answer teaches us something important.",
        "Good try! Every mistake is a learning opportunity.",
        "Almost there! Let's explore why the right answer works.",
        "Nice effort! Understanding why helps us remember better."
    ],

    // Enhanced question examples for different course types
    programmingQuestions: {
        beginner: [
            {
                text: "If variables in programming were like containers in your kitchen, which statement would be most accurate?",
                answers: [
                    "You can put anything in any container, just like any value in any variable",
                    "Each container has a label and can hold specific types of things",
                    "Containers are permanent and can never be emptied or reused",
                    "You don't need to label containers, just remember what's inside"
                ],
                correct: 1,
                explanation: "Variables have names (labels) and types (what they can hold), just like kitchen containers!"
            }
        ]
    },

    businessQuestions: {
        leadership: [
            {
                text: "Your team is facing a tight deadline and morale is low. Which approach would most likely improve both productivity and team spirit?",
                answers: [
                    "Set up brief daily check-ins to address blockers and celebrate small wins",
                    "Remind everyone about the consequences of missing the deadline",
                    "Take over the most difficult tasks yourself to reduce team burden",
                    "Promise a big reward only if the deadline is met perfectly"
                ],
                correct: 0,
                explanation: "Regular check-ins help identify problems early while celebrating progress boosts morale"
            }
        ]
    }
};

// Function to mix question types for variety
export function generateVariedQuestions(topic, count = 10) {
    const questionTypes = [
        'scenario',
        'analogy',
        'troubleshooting',
        'bestPractice',
        'application',
        'comparison',
        'causeEffect',
        'process',
        'evaluation',
        'synthesis'
    ];
    
    const questions = [];
    for (let i = 0; i < count; i++) {
        const type = questionTypes[i % questionTypes.length];
        questions.push({
            type,
            topic,
            difficulty: i < 3 ? 'easy' : i < 7 ? 'medium' : 'hard'
        });
    }
    
    return questions;
}

// Mascot reactions for different scenarios
export const MASCOT_REACTIONS = {
    correct: {
        expression: "happy",
        message: "You're amazing! 🌟",
        animation: "celebrate"
    },
    incorrect: {
        expression: "encouraging",
        message: "Keep trying! You've got this!",
        animation: "supportive"
    },
    thinking: {
        expression: "curious",
        message: "Take your time...",
        animation: "thinking"
    },
    complete: {
        expression: "proud",
        message: "Quiz completed! You're a star! ⭐",
        animation: "victory"
    }
};