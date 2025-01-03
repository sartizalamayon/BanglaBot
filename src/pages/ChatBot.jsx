import { useState } from 'react';
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
} from '@ionic/react';
import { sendSharp, documentAttach, cloudUpload } from 'ionicons/icons';
import './ChatBot.css';

const ChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setToastMessage('PDF selected: ' + file.name);
      setShowToast(true);
    } else {
      setToastMessage('Please select a PDF file');
      setShowToast(true);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      setToastMessage('Upload functionality will be implemented later');
      setShowToast(true);
    }
  };

  const handleSend = () => {
    if (!inputText.trim()) return;

    const newMessage = {
      text: inputText,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    setMessages([...messages, newMessage]);
    setInputText('');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Chat Assistant</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="chat-content">
        <div className="pdf-upload-section">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            id="pdf-upload"
          />
          <label htmlFor="pdf-upload" className="upload-button">
            <IonIcon icon={documentAttach} />
            <span>Select PDF</span>
          </label>
          {selectedFile && (
            <div className="selected-file">
              <span>{selectedFile.name}</span>
              <IonButton
                fill="clear"
                size="small"
                onClick={handleUpload}
              >
                <IonIcon icon={cloudUpload} slot="start" />
                Upload
              </IonButton>
            </div>
          )}
        </div>

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
            <div className="bot-message">
              <div className="message-content">
                <IonSpinner name="dots" />
              </div>
            </div>
          )}
        </div>
      </IonContent>

      <IonFooter className="chat-footer">
        <div className="input-container">
          <IonTextarea
            placeholder="Type your message..."
            value={inputText}
            onIonChange={e => setInputText(e.detail.value)}
            rows={1}
            autoGrow={true}
            className="chat-input"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <IonButton
            fill="clear"
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="send-button"
          >
            <IonIcon icon={sendSharp} />
          </IonButton>
        </div>
      </IonFooter>

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={2000}
        position="bottom"
      />
    </IonPage>
  );
};

export default ChatBot;
