# ALM Kawaii Quiz - AI-Powered Quiz Generation for Adobe Learning Manager

🎯 **Transform your Adobe Learning Manager courses with AI-powered, contextual quiz generation in seconds!**

![Quiz Generation Demo](screenshots/Screenshot%20from%202025-06-27%2009-41-09.png)

## 🚀 What is This?

ALM Kawaii Quiz is a native extension for Adobe Learning Manager that brings the power of AI to your learning platform. It automatically generates contextual quizzes based on your actual course content, making quiz creation effortless for instructors and engaging for learners.

### ✨ Key Features

- **🤖 AI-Powered Generation**: Uses Anthropic's Claude Haiku to create intelligent, contextual questions
- **📚 Course-Aware**: Reads your actual course content to generate relevant questions
- **🎮 Dual Mode System**: 
  - Instructor mode for creating and assigning quizzes
  - Learner mode with priority system (assigned quizzes first, then fun games)
- **🔄 Always-On**: Lives in the sidebar, ready whenever you need it
- **📊 Full xAPI Tracking**: Every score, every attempt, properly recorded
- **🔐 Self-Healing Auth**: Automatic token refresh with Discord webhook monitoring
- **⚡ Zero Setup**: Deploys instantly to every course instance

## 🎬 See It In Action

### For Instructors
![Instructor View](screenshots/Screenshot%20from%202025-06-27%2009-41-28.png)
*Generate contextual quiz questions with one click*

### For Learners
![Learner View](screenshots/Screenshot%20from%202025-06-27%2009-46-38.png)
*Smart priority system - assigned quizzes appear automatically*

![Quiz Interface](screenshots/Screenshot%20from%202025-06-27%2009-48-16.png)
*Clean, engaging quiz interface with kawaii-inspired design*

## 🛠️ Technical Architecture

```
Adobe Learning Manager
├── Native Extension Framework
│   ├── Instance Bar Integration (Instructors)
│   └── Sidebar Widget (Learners)
├── API Integration
│   ├── Course Content API
│   ├── User/Enrollment API
│   └── xAPI for Score Tracking
└── External Services
    ├── Anthropic Claude Haiku (Quiz Generation)
    ├── PHP Backend (Token Management)
    └── Discord Webhooks (Monitoring)
```

## 📋 Prerequisites

- Adobe Learning Manager account with Integration Admin access
- PHP 7.4+ hosting environment
- Anthropic API key
- Basic understanding of ALM native extensions

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/ALM-Kawaii-Quiz.git
cd ALM-Kawaii-Quiz
```

### 2. Configure Your Environment
```bash
cp config.php.example config.php
# Edit config.php with your credentials:
# - ALM Client ID & Secret
# - Anthropic API Key
# - Your ALM instance URL
```

### 3. Deploy to Your Server
```bash
# Upload files to your PHP server
# Ensure proper permissions on token storage directory
chmod 755 tokens/
```

### 4. Register in Adobe Learning Manager
1. Log in as Integration Admin
2. Navigate to Native Extensions
3. Register new extension pointing to your server
4. Configure scopes (Admin read/write)

### 5. Test It Out!
- Instructors: Look for "PoP Quiz" in any course instance menu
- Learners: Check the sidebar for the quiz widget

## 🔧 Configuration

### Essential Files

- `config.php` - Main configuration (API keys, URLs)
- `app.js` - Frontend quiz interface
- `quiz-api.php` - Backend API handler
- `token-service.php` - OAuth token management
- `generate-quiz.php` - AI quiz generation logic

### Token Management

The system uses a multi-layered approach to ensure 100% uptime:
- Automatic refresh every 6 days (tokens last 7)
- Cron job validation every 48 hours
- Real-time validation on each API call
- Discord webhook alerts for any failures

## 📚 API Integration Guide

### Authentication Flow
```javascript
// Initial setup
const auth = await getAccessToken(clientId, clientSecret);

// Automatic refresh (handled by server)
// Tokens refresh before expiration
// No manual intervention needed!
```

### Quiz Generation
```javascript
// 1. Get course content
const content = await fetchCourseContent(courseId);

// 2. Generate quiz with AI
const quiz = await generateQuizFromContent(content);

// 3. Save for learners
await saveQuizToInstance(courseId, quiz);
```

## 🎨 Customization

### Modify Quiz Prompts
Edit `quiz-prompts-enhanced.js` to customize:
- Question types
- Difficulty levels
- Topic focus
- Language style

### UI Customization
- `styles.css` - Main interface styles
- `quiz-modal-override.css` - Quiz popup styling
- Icons in `/icons/` - Kawaii-inspired UI elements

## 🚨 Monitoring & Alerts

### Discord Webhook Setup
1. Create webhook in your Discord server
2. Add webhook URL to `config.php`
3. Receive instant alerts for:
   - Token refresh failures
   - API errors
   - System health checks

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Areas for Contribution
- Additional language support
- New question types
- Analytics dashboard
- Mobile app integration
- Performance optimizations

## 📖 Documentation

- [Full API Documentation](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)
- [Architecture Overview](docs/ARCHITECTURE.md)

## 🐛 Known Issues

- CORS restrictions require backend proxy for API calls
- Quiz state persists in localStorage (clear if needed)
- Maximum 10 questions per generation (Haiku limitation)

## 🎉 Success Stories

> "Reduced quiz creation time from hours to seconds. Our instructors love it!"
> - Enterprise Learning Manager

> "The smart priority system means learners always see what matters most."
> - L&D Director

## 📜 License

MIT License - See [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

- Adobe Learning Manager team for the extensible platform
- Anthropic for Claude Haiku API
- The patient Adobe engineers who answered endless questions
- Green tea, for fuel

## 📞 Support

- GitHub Issues: [Report bugs or request features](https://github.com/yourusername/ALM-Kawaii-Quiz/issues)
- Blog Series: [Read the journey](https://linkedin.com/in/doctorpartridge)
- Email: support@your-domain.com

---

**Built with ❤️ and lots of melting green tea by Dr. Allen Partridge**

*From "What's an API?" to production deployment in 7 days. If we can do it, so can you!*