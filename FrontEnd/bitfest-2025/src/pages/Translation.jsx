import { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonTextarea,
  IonButton,
  IonIcon,
  IonSpinner,
  IonFab,
  IonFabButton,
  IonToast,
  useIonViewWillEnter,
  isPlatform,
  IonGrid,
  IonRow,
  IonCol,
  IonProgressBar,
  IonSkeletonText,
  IonModal,
  IonImg,
} from '@ionic/react';
import { alertController } from '@ionic/core';
import { language, download, camera } from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import './Translation.css';

// Use your computer's IP address when testing with live reload
const API_URL = 'http://192.168.12.199:3000';
const WEB_URL = 'http://localhost:3000';

const Translation = () => {
  const [banglishText, setBanglishText] = useState('');
  const [banglaText, setBanglaText] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [loadingText, setLoadingText] = useState('');
  const [capturedImage, setCapturedImage] = useState('');
  const [showImagePreview, setShowImagePreview] = useState(false);

  useEffect(() => {
    const words = banglishText.trim().split(/\s+/);
    setWordCount(banglishText.trim() === '' ? 0 : words.length);
  }, [banglishText]);

  const takePicture = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt,
      });

      if (image.dataUrl) {
        setCapturedImage(image.dataUrl);
        setShowImagePreview(true);
      }
    } catch (error) {
      console.error('Camera error:', error);
      setToastMessage('Failed to capture image. Please try again.');
      setShowToast(true);
    }
  };

  const closeImagePreview = () => {
    setShowImagePreview(false);
    setCapturedImage('');
  };

  const processImage = () => {
    // This function will be implemented when you provide the API
    setToastMessage('Image processing API will be implemented soon');
    setShowToast(true);
    setShowImagePreview(false);
    setCapturedImage('');
  };

  const handleConvert = async () => {
    if (!banglishText.trim()) {
      setToastMessage('Please enter some text to convert');
      setShowToast(true);
      return;
    }

    setIsConverting(true);
    setLoadingText('Converting to Bangla...');
    try {
      const baseUrl = isPlatform('hybrid') ? API_URL : WEB_URL;
      const response = await fetch(`${baseUrl}/api/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          text: banglishText
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        throw new Error(`Conversion failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      if (!data.convertedBangla) {
        throw new Error('Invalid response format');
      }
      
      setBanglaText(data.convertedBangla);
      setToastMessage('Conversion completed!');
    } catch (error) {
      console.error('Conversion error:', error);
      setToastMessage(`Failed to convert text: ${error.message}`);
      setBanglaText('');
    } finally {
      setIsConverting(false);
      setLoadingText('');
      setShowToast(true);
    }
  };

  const handleExport = async () => {
    if (!banglaText) {
      setToastMessage('No converted text to export');
      setShowToast(true);
      return;
    }

    try {
      setIsExporting(true);
      setLoadingText('Generating metadata...');
      const baseUrl = isPlatform('hybrid') ? API_URL : WEB_URL;
      const response = await fetch(`${baseUrl}/api/generate-metadata`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          text: banglaText
        })
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const result = await response.json();
      
      const alert = await alertController.create({
        header: 'Success!',
        message: 'Your translation has been exported successfully.',
        buttons: ['OK'],
        cssClass: 'custom-alert'
      });

      await alert.present();
      setToastMessage('Export completed!');
      setShowToast(true);
    } catch (error) {
      console.error('Export error:', error);
      setToastMessage('Failed to export. Please try again.');
      setShowToast(true);
    } finally {
      setIsExporting(false);
      setLoadingText('');
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Banglish Editor</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {(isConverting || isExporting) && (
          <IonProgressBar type="indeterminate" color="primary" className="loading-progress" />
        )}
        <div className="editor-container">
          <IonGrid>
            <IonRow>
              <IonCol>
                <div className="editor-content">
                  <div className="textarea-container">
                    <IonTextarea
                      className="editor-textarea"
                      placeholder="Write your Banglish text here..."
                      value={banglishText}
                      onIonChange={e => setBanglishText(e.detail.value)}
                      autoGrow={true}
                      rows={6}
                    />
                    <IonFab vertical="bottom" horizontal="end" slot="fixed" className="camera-fab">
                      <IonFabButton size="small" onClick={takePicture}>
                        <IonIcon icon={camera} />
                      </IonFabButton>
                    </IonFab>
                  </div>
                  <div className="word-count">
                    {wordCount} {wordCount === 1 ? 'word' : 'words'}
                  </div>
                </div>
              </IonCol>
            </IonRow>
            
            <IonRow>
              <IonCol>
                <div className="editor-content">
                  {isConverting ? (
                    <div className="loading-container">
                      <IonSkeletonText 
                        animated={true}
                        className="loading-skeleton"
                      />
                      <div className="loading-text">{loadingText}</div>
                    </div>
                  ) : banglaText && (
                    <IonTextarea
                      className="editor-textarea bangla-text"
                      value={banglaText}
                      readonly
                      autoGrow={true}
                      rows={6}
                    />
                  )}
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>
          
          <div className="editor-actions">
            <IonButton
              className="editor-button"
              expand="block"
              onClick={handleConvert}
              disabled={isConverting || isExporting}
            >
              {isConverting ? (
                <>
                  <IonSpinner name="crescent" />
                  <span className="loading-text">{loadingText}</span>
                </>
              ) : (
                <>
                  <IonIcon slot="start" icon={language} />
                  Convert
                </>
              )}
            </IonButton>
            {banglaText && (
              <IonButton
                className="editor-button"
                expand="block"
                color="secondary"
                onClick={handleExport}
                disabled={isConverting || isExporting}
              >
                {isExporting ? (
                  <>
                    <IonSpinner name="crescent" />
                    <span className="loading-text">{loadingText}</span>
                  </>
                ) : (
                  <>
                    <IonIcon slot="start" icon={download} />
                    Export
                  </>
                )}
              </IonButton>
            )}
          </div>
        </div>

        <IonModal isOpen={showImagePreview} onDidDismiss={closeImagePreview}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Preview Image</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            {capturedImage && (
              <div className="preview-container">
                <IonImg src={capturedImage} alt="Captured" className="preview-image" />
                <div className="preview-actions">
                  <IonButton onClick={processImage} expand="block">
                    Process Image
                  </IonButton>
                  <IonButton onClick={closeImagePreview} color="medium" expand="block">
                    Cancel
                  </IonButton>
                </div>
              </div>
            )}
          </IonContent>
        </IonModal>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
          position={isPlatform('mobile') ? 'bottom' : 'top'}
        />
      </IonContent>
    </IonPage>
  );
};

export default Translation;
