// Inject styles directly into the page when modal is created
function injectModalStyles() {
    // Check if styles already exist
    if (document.getElementById('kawaii-modal-styles')) return;
    
    const styleSheet = document.createElement('style');
    styleSheet.id = 'kawaii-modal-styles';
    styleSheet.textContent = `
        /* Modal Overlay */
        #modal {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            background: rgba(0, 0, 0, 0.7) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            z-index: 999999 !important;
            padding: 20px !important;
        }
        
        /* Modal Content Container */
        #modal .modal-content {
            background: white !important;
            border-radius: 16px !important;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3) !important;
            max-width: 700px !important;
            width: 100% !important;
            max-height: 85vh !important;
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
        }
        
        /* Question Editor */
        .question-editor {
            display: flex !important;
            flex-direction: column !important;
            height: 100% !important;
            background: white !important;
        }
        
        .question-editor .editor-header {
            padding: 20px 30px !important;
            border-bottom: 1px solid #eee !important;
            background: #f8f9fa !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
        }
        
        .question-editor .editor-header h2 {
            margin: 0 !important;
            color: #FF69B4 !important;
            font-size: 1.5em !important;
            font-weight: 600 !important;
        }
        
        .question-editor .btn-close {
            background: none !important;
            border: none !important;
            font-size: 30px !important;
            cursor: pointer !important;
            color: #999 !important;
            width: 40px !important;
            height: 40px !important;
            border-radius: 50% !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            transition: all 0.2s !important;
            padding: 0 !important;
            line-height: 1 !important;
        }
        
        .question-editor .btn-close:hover {
            background: #f5f5f5 !important;
            color: #333 !important;
        }
        
        .question-editor .editor-content {
            padding: 30px !important;
            flex: 1 !important;
            overflow-y: auto !important;
            background: white !important;
        }
        
        .question-editor .form-group {
            margin-bottom: 25px !important;
        }
        
        .question-editor .form-group label {
            display: block !important;
            margin-bottom: 10px !important;
            font-weight: 600 !important;
            color: #333 !important;
            font-size: 14px !important;
        }
        
        .question-editor textarea,
        .question-editor input[type="text"] {
            width: 100% !important;
            padding: 12px !important;
            border: 2px solid #e0e0e0 !important;
            border-radius: 8px !important;
            font-size: 16px !important;
            font-family: inherit !important;
            transition: border-color 0.2s !important;
            background: white !important;
            color: #333 !important;
            box-sizing: border-box !important;
        }
        
        .question-editor textarea:focus,
        .question-editor input[type="text"]:focus {
            outline: none !important;
            border-color: #FF69B4 !important;
        }
        
        .question-editor textarea {
            resize: vertical !important;
            min-height: 80px !important;
        }
        
        .question-editor .answer-input-group {
            display: flex !important;
            align-items: center !important;
            margin-bottom: 10px !important;
            gap: 10px !important;
        }
        
        .question-editor .answer-input-group input[type="radio"] {
            width: 20px !important;
            height: 20px !important;
            cursor: pointer !important;
            margin: 0 !important;
        }
        
        .question-editor .answer-input {
            flex: 1 !important;
        }
        
        .question-editor .editor-footer {
            padding: 20px 30px !important;
            border-top: 1px solid #eee !important;
            background: #f8f9fa !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
        }
        
        .question-editor .nav-buttons {
            display: flex !important;
            gap: 10px !important;
        }
        
        /* Buttons in modal */
        .question-editor button {
            padding: 10px 20px !important;
            border: none !important;
            border-radius: 8px !important;
            font-size: 14px !important;
            font-weight: 500 !important;
            cursor: pointer !important;
            transition: all 0.3s ease !important;
            font-family: inherit !important;
        }
        
        .question-editor .btn-primary {
            background: #FF69B4 !important;
            color: white !important;
        }
        
        .question-editor .btn-primary:hover:not(:disabled) {
            background: #FF1493 !important;
            transform: translateY(-1px) !important;
        }
        
        .question-editor .btn-secondary {
            background: #87CEEB !important;
            color: #333 !important;
        }
        
        .question-editor .btn-secondary:hover:not(:disabled) {
            background: #6BB6D6 !important;
            transform: translateY(-1px) !important;
        }
        
        .question-editor .btn-nav {
            background: #f5f5f5 !important;
            color: #666 !important;
        }
        
        .question-editor .btn-nav:hover:not(:disabled) {
            background: #e0e0e0 !important;
        }
        
        .question-editor button:disabled {
            opacity: 0.5 !important;
            cursor: not-allowed !important;
            transform: none !important;
        }
        
        /* Responsive */
        @media (max-width: 600px) {
            #modal {
                padding: 10px !important;
            }
            
            #modal .modal-content {
                max-height: 95vh !important;
            }
            
            .question-editor .editor-header,
            .question-editor .editor-content,
            .question-editor .editor-footer {
                padding: 15px !important;
            }
        }
    `;
    
    document.head.appendChild(styleSheet);
}