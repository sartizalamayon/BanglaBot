import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LogoutButton from '../components/LogoutButton';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonFooter,
  IonTextarea,
  IonButton,
  IonIcon,
  IonSpinner,
  IonItem,
  IonLabel,
  IonInput,
  IonToast,
  isPlatform,
  IonButtons,
} from '@ionic/react';
import { sendSharp, documentAttach, cloudUpload } from 'ionicons/icons';
import './ChatBot.css';

const API_URL = 'http://192.168.12.199:3000';
const WEB_URL = 'http://localhost:3000';

const ChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser?.email) {
      fetchChatHistory();
    }
  }, [currentUser]);

  const fetchChatHistory = async () => {
    try {
      const baseUrl = isPlatform('hybrid') ? API_URL : WEB_URL;
      const response = await fetch(`${baseUrl}/api/chat/history/${encodeURIComponent(currentUser.email)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch chat history');
      }

      const history = await response.json();
      const formattedMessages = history.map(chat => ([
        {
          text: chat.input,
          sender: 'user',
          timestamp: chat.timestamp,
        },
        {
          text: chat.response,
          sender: 'bot',
          timestamp: chat.timestamp,
        }
      ])).flat();

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error fetching chat history:', error);
      setToastMessage('Failed to load chat history');
      setShowToast(true);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type === 'application/pdf') {
        // Verify file size (limit to 10MB)
        if (file.size > 10 * 1024 * 1024) {
          setToastMessage('PDF file size must be less than 10MB');
          setShowToast(true);
          event.target.value = '';
          return;
        }
        
        setSelectedFile(file);
        setToastMessage('PDF selected: ' + file.name);
        setShowToast(true);
      } else {
        setToastMessage('Please select a PDF file');
        setShowToast(true);
        event.target.value = '';
      }
    }
  };

  const handleSend = async () => {
    // Require text input when PDF is attached
    if (selectedFile && !inputText.trim()) {
      setToastMessage('Please enter a question about the PDF');
      setShowToast(true);
      return;
    }

    // Regular text-only validation
    if (!inputText.trim() && !selectedFile) return;
    
    if (!currentUser?.email) {
      setToastMessage('Please sign in to use the chat');
      setShowToast(true);
      return;
    }

    const userMessage = {
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('text', inputText.trim());
      formData.append('email', currentUser.email);
      
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      const baseUrl = isPlatform('hybrid') ? API_URL : WEB_URL;
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      const botMessage = {
        text: data.response,
        sender: 'bot',
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, botMessage]);
      
      if (selectedFile) {
        setSelectedFile(null);
        const fileInput = document.getElementById('pdf-upload');
        if (fileInput) {
          fileInput.value = '';
        }
      }

    } catch (error) {
      console.error('Chat error:', error);
      setToastMessage('Failed to get response from chat');
      setShowToast(true);
      
      // Remove the failed user message
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Chat</IonTitle>
          <IonButtons slot="end">
            <LogoutButton />
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="chat-content">
        <div className="messages-container">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`message ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}
            >
              <div className="message-content">
                <p>{message.text}</p>
                <span className="timestamp">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message bot-message">
              <div className="message-content">
                <IonSpinner name="dots" />
              </div>
            </div>
          )}
        </div>
      </IonContent>

      <IonFooter>
        <div className="input-container">
          <input
            type="file"
            id="pdf-upload"
            accept=".pdf"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <IonButton
            fill="clear"
            onClick={() => document.getElementById('pdf-upload').click()}
          >
            <IonIcon icon={documentAttach} />
          </IonButton>
          
          <IonTextarea
            value={inputText}
            onIonChange={e => setInputText(e.detail.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            rows={1}
            autoGrow={true}
            className="chat-input"
            disabled={isLoading}
          />
          
          <IonButton
            fill="clear"
            onClick={handleSend}
            disabled={isLoading || (!inputText.trim() && !selectedFile)}
          >
            <IonIcon icon={sendSharp} />
          </IonButton>
        </div>
      </IonFooter>

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        position="top"
      />
    </IonPage>
  );
};

export default ChatBot;
