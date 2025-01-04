import { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonSkeletonText,
  IonIcon,
  IonSearchbar,
  IonChip,
  IonRefresher,
  IonRefresherContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonButton,
  IonButtons,
  isPlatform,
  IonToast,
  IonModal,
  IonImg,
  IonSpinner,
} from '@ionic/react';
import {
  timeOutline,
  documentTextOutline,
  downloadOutline,
  searchOutline,
  refreshOutline,
  imageOutline,
  closeOutline,
} from 'ionicons/icons';
import { Filesystem, Directory } from '@capacitor/filesystem';
import LogoutButton from '../components/LogoutButton';
import './ContentManager.css';

const API_URL = 'http://192.168.12.199:3000';
const WEB_URL = 'http://localhost:3000';
const ITEMS_PER_PAGE = 10;
const API_KEY = '45eb6bf4b0200654e0817313368cfe7f6e86c069f1cc00be3c0cc89587f4b5830b806b418649a229ed6465935aeb5437';

const ContentManager = () => {
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isGeneratingManga, setIsGeneratingManga] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [showMangaModal, setShowMangaModal] = useState(false);
  const [currentManga, setCurrentManga] = useState(null);
  const [mangaPages, setMangaPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizData, setQuizData] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [showResults, setShowResults] = useState(false);

  const fetchPDFs = async (refresh = false) => {
    try {
      const baseUrl = isPlatform('hybrid') ? API_URL : WEB_URL;
      const response = await fetch(`${baseUrl}/api/public/pdfs`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch PDFs');
      }

      const data = await response.json();
      setPdfs(data);
      setHasMore(data.length >= ITEMS_PER_PAGE);
    } catch (error) {
      console.error('Error fetching PDFs:', error);
      setToastMessage('Failed to load PDFs');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPDFs();
  }, []);

  const handleRefresh = async (event) => {
    setPage(1);
    await fetchPDFs(true);
    event.detail.complete();
  };

  const handleInfiniteScroll = async (event) => {
    setPage(prev => prev + 1);
    event.target.complete();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownload = async (pdf) => {
    try {
      const baseUrl = isPlatform('hybrid') ? API_URL : WEB_URL;
      const response = await fetch(`${baseUrl}/api/download-pdf/${pdf._id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to download PDF');
      }

      // For mobile devices
      if (isPlatform('hybrid')) {
        try {
          const blob = await response.blob();
          const reader = new FileReader();
          
          reader.onloadend = async () => {
            try {
              const base64data = reader.result;
              const fileName = `${pdf.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
              
              await Filesystem.writeFile({
                path: fileName,
                data: base64data.split(',')[1],
                directory: Directory.Documents,
                recursive: true
              });
              
              setToastMessage('PDF saved to Documents');
              setShowToast(true);
            } catch (writeError) {
              console.error('File write error:', writeError);
              setToastMessage('Failed to save PDF to device');
              setShowToast(true);
            }
          };
          
          reader.onerror = () => {
            setToastMessage('Failed to process PDF file');
            setShowToast(true);
          };
          
          reader.readAsDataURL(blob);
        } catch (mobileError) {
          console.error('Mobile download error:', mobileError);
          setToastMessage('Failed to download on mobile');
          setShowToast(true);
        }
      } 
      // For web browsers
      else {
        try {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          const fileName = `${pdf.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
          
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          
          // Cleanup
          setTimeout(() => {
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          }, 100);
          
          setToastMessage('PDF downloaded successfully');
          setShowToast(true);
        } catch (webError) {
          console.error('Web download error:', webError);
          setToastMessage('Failed to download in browser');
          setShowToast(true);
        }
      }
    } catch (error) {
      console.error('Download error:', error);
      setToastMessage(error.message || 'Failed to download PDF');
      setShowToast(true);
    }
  };

  const getStoryFromAPI = async (pdfId) => {
    try {
      setIsGeneratingManga(true);
      const response = await fetch(`${isPlatform('hybrid') ? API_URL : WEB_URL}/api/generate-story/${pdfId}`);

      if (!response.ok) {
        throw new Error('Failed to generate story');
      }

      const data = await response.json();
      // Parse the Bangla text if it's a JSON string
      let banglaParsed = typeof data.Bangla === 'string' ? 
        (data.Bangla.startsWith('{') ? JSON.parse(data.Bangla).convertedBangla : data.Bangla) 
        : data.Bangla;

      // Split the Bangla text into meaningful chunks
      const sentences = banglaParsed.split('।').filter(Boolean);
      const chunkSize = Math.ceil(sentences.length / 5);
      const banglaChunks = [];
      
      for (let i = 0; i < sentences.length; i += chunkSize) {
        const chunk = sentences.slice(i, i + chunkSize).join('।') + '।';
        banglaChunks.push(chunk);
      }

      // Do the same for English text
      const englishSentences = data.story.split('.').filter(Boolean);
      const englishChunks = [];
      const englishChunkSize = Math.ceil(englishSentences.length / 5);

      for (let i = 0; i < englishSentences.length; i += englishChunkSize) {
        const chunk = englishSentences.slice(i, i + englishChunkSize).join('.') + '.';
        englishChunks.push(chunk);
      }

      return {
        english: englishChunks,
        bangla: banglaChunks
      };
    } catch (error) {
      console.error('Error getting story:', error);
      throw new Error('Failed to get story from API');
    } finally {
      setIsGeneratingManga(false);
    }
  };

  const generateMangaPrompts = (storyData) => {
    // Use the pre-chunked stories
    const englishSections = storyData.english;
    const banglaSections = storyData.bangla;
    
    // Ensure we have exactly 5 sections
    const paddedEnglish = englishSections.length < 5 
      ? [...englishSections, ...Array(5 - englishSections.length).fill('Continue the story...')]
      : englishSections.slice(0, 5);
    
    const paddedBangla = banglaSections.length < 5 
      ? [...banglaSections, ...Array(5 - banglaSections.length).fill('গল্প চলবে...')]
      : banglaSections.slice(0, 5);

    const sceneTypes = [
      {
        type: 'opening',
        bengaliType: 'শুরু',
        promptPrefix: 'dramatic opening scene showing'
      },
      {
        type: 'development',
        bengaliType: 'বিকাশ',
        promptPrefix: 'story development with'
      },
      {
        type: 'climax',
        bengaliType: 'চরম মুহূর্ত',
        promptPrefix: 'exciting climax showing'
      },
      {
        type: 'resolution',
        bengaliType: 'সমাধান',
        promptPrefix: 'resolution scene with'
      },
      {
        type: 'conclusion',
        bengaliType: 'সমাপ্তি',
        promptPrefix: 'final conclusion showing'
      }
    ];
    
    return sceneTypes.map((scene, index) => ({
      type: scene.type,
      bengaliType: scene.bengaliType,
      prompt: `manga style illustration, ${scene.promptPrefix}: ${paddedEnglish[index]}, detailed anime art style, clean lines`,
      text: paddedBangla[index],
      englishText: paddedEnglish[index]
    }));
  };

  const handleGenerateManga = async (pdf) => {
    try {
      setIsGeneratingManga(true);
      setToastMessage('গল্প তৈরি করা হচ্ছে...');  // Generating story...
      setShowToast(true);
      setMangaPages([]);

      // Get both English and Bangla stories
      const storyData = await getStoryFromAPI(pdf._id);
      setToastMessage('ম্যাঙ্গা তৈরি করা হচ্ছে...');  // Creating manga...
      setShowToast(true);

      const scenes = generateMangaPrompts(storyData);
      const generatedPages = [];

      for (let i = 0; i < scenes.length; i++) {
        setToastMessage(`পৃষ্ঠা ${i + 1} তৈরি করা হচ্ছে ${scenes.length} টির মধ্যে...`);  // Generating page X of Y...
        setShowToast(true);

        const form = new FormData();
        form.append('prompt', `${scenes[i].prompt}, educational manga style, clean lines, engaging composition`);

        const response = await fetch('https://clipdrop-api.co/text-to-image/v1', {
          method: 'POST',
          headers: {
            'x-api-key': '45eb6bf4b0200654e0817313368cfe7f6e86c069f1cc00be3c0cc89587f4b5830b806b418649a229ed6465935aeb5437',
          },
          body: form,
        });

        if (!response.ok) {
          throw new Error(`${i + 1} নম্বর পৃষ্ঠা তৈরি করতে ব্যর্থ`);  // Failed to generate page X
        }

        const buffer = await response.arrayBuffer();
        const base64Image = btoa(
          new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );

        generatedPages.push({
          image: `data:image/png;base64,${base64Image}`,
          type: scenes[i].type,
          bengaliType: scenes[i].bengaliType,
          description: scenes[i].prompt,
          text: scenes[i].text,           // Bangla text
          englishText: scenes[i].englishText  // English text (if needed)
        });
      }

      setMangaPages(generatedPages);
      setCurrentPage(0);
      setCurrentManga({
        title: pdf.title,
        pages: generatedPages,
        timestamp: new Date().toISOString()
      });
      
      setShowMangaModal(true);
      setToastMessage('ম্যাঙ্গা সফলভাবে তৈরি হয়েছে!');  // Manga successfully generated!
      setShowToast(true);
      
    } catch (error) {
      console.error('Manga generation error:', error);
      setToastMessage(error.message || 'ম্যাঙ্গা তৈরি করতে ব্যর্থ');  // Failed to generate manga
      setShowToast(true);
    } finally {
      setIsGeneratingManga(false);
    }
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, mangaPages.length - 1));
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 0));
  };

  const addTestPDF = async () => {
    try {
      const testPDF = {
        title: "Understanding Motion: Physics Made Easy",
        text: `Let's learn about motion in physics! Motion is how objects move through space over time. The key formulas are:

1. Distance = Speed × Time (d = v × t)
When a car travels at 60 km/h for 2 hours, it covers 120 km. Simple!

2. Acceleration = Change in Velocity ÷ Time (a = Δv/t)
Think of a car going from 0 to 60 km/h in 10 seconds. That's acceleration!

3. Force = Mass × Acceleration (F = ma)
A 1000 kg car needs more force to move than a 10 kg bicycle.

4. Kinetic Energy = ½ × Mass × Velocity² (KE = ½mv²)
This is why fast cars have more energy than slow ones.

5. These formulas help us understand everything from bicycles to rockets!`,
        date: new Date().toISOString(),
        _id: 'test_' + Date.now()
      };

      setPdfs(prevPdfs => [testPDF, ...prevPdfs]);
      setToastMessage('Test PDF added! Click Generate Manga to test.');
      setShowToast(true);
    } catch (error) {
      console.error('Error adding test PDF:', error);
      setToastMessage('Failed to add test PDF');
      setShowToast(true);
    }
  };

  const formatQuizData = (apiResponse) => {
    // Convert API response format to our quiz format
    const questions = [
      {
        id: 1,
        question: apiResponse.question_one.question,
        options: [
          apiResponse.question_one.answers.option_a,
          apiResponse.question_one.answers.option_b,
          apiResponse.question_one.answers.option_c,
          apiResponse.question_one.answers.option_d
        ],
        correctAnswer: apiResponse.question_one.answers.correct_answer
      },
      {
        id: 2,
        question: apiResponse.question_two.question,
        options: [
          apiResponse.question_two.answers.option_a,
          apiResponse.question_two.answers.option_b,
          apiResponse.question_two.answers.option_c,
          apiResponse.question_two.answers.option_d
        ],
        correctAnswer: apiResponse.question_two.answers.correct_answer
      },
      {
        id: 3,
        question: apiResponse.question_three.question,
        options: [
          apiResponse.question_three.answers.option_a,
          apiResponse.question_three.answers.option_b,
          apiResponse.question_three.answers.option_c,
          apiResponse.question_three.answers.option_d
        ],
        correctAnswer: apiResponse.question_three.answers.correct_answer
      },
      {
        id: 4,
        question: apiResponse.question_four.question,
        options: [
          apiResponse.question_four.answers.option_a,
          apiResponse.question_four.answers.option_b,
          apiResponse.question_four.answers.option_c,
          apiResponse.question_four.answers.option_d
        ],
        correctAnswer: apiResponse.question_four.answers.correct_answer
      }
    ];
    return { questions };
  };

  const getQuizFromAPI = async (pdfId) => {
    try {
      setIsGeneratingQuiz(true);
      const response = await fetch(`${isPlatform('hybrid') ? API_URL : WEB_URL}/api/generate-quiz/${pdfId}`);
      
      if (!response.ok) {
        throw new Error('Failed to generate quiz');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting quiz:', error);
      throw new Error('Failed to get quiz from API');
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleStartQuiz = async (pdf) => {
    try {
      setShowToast(true);
      setToastMessage('কুইজ তৈরি করা হচ্ছে...');  // Generating quiz...
      
      const apiResponse = await getQuizFromAPI(pdf._id);
      const formattedQuiz = formatQuizData(apiResponse);
      setQuizData(formattedQuiz);
      setCurrentQuestion(0);
      setAnswers([]);
      setShowResults(false);
      setShowQuizModal(true);
      
    } catch (error) {
      console.error('Quiz generation error:', error);
      setToastMessage('কুইজ তৈরি করতে ব্যর্থ');  // Failed to generate quiz
      setShowToast(true);
    }
  };

  const handleAnswerSelect = (selectedOption) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = selectedOption;
    setAnswers(newAnswers);

    // Short delay to show selection before moving to next question
    setTimeout(() => {
      if (currentQuestion < quizData.questions.length - 1) {
        setCurrentQuestion(curr => curr + 1);
      } else {
        setShowResults(true);
      }
    }, 500);
  };

  const calculateScore = () => {
    if (!quizData) return 0;
    return answers.reduce((score, answer, index) => {
      return score + (answer === quizData.questions[index].correctAnswer ? 1 : 0);
    }, 0);
  };

  const filteredPDFs = pdfs
    .filter(pdf => 
      pdf.title.toLowerCase().includes(searchText.toLowerCase()) ||
      pdf.text.toLowerCase().includes(searchText.toLowerCase())
    )
    .slice(0, page * ITEMS_PER_PAGE);

  const renderSkeletons = () => (
    Array(3).fill(0).map((_, index) => (
      <IonCard key={`skeleton-${index}`} className="pdf-card">
        <IonCardHeader>
          <IonSkeletonText animated style={{ width: '70%' }} />
        </IonCardHeader>
        <IonCardContent>
          <IonSkeletonText animated style={{ width: '100%', height: '100px' }} />
          <div className="card-footer">
            <IonSkeletonText animated style={{ width: '30%' }} />
          </div>
        </IonCardContent>
      </IonCard>
    ))
  );

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Public Content</IonTitle>
          <IonButtons slot="end">
            {process.env.NODE_ENV === 'development' && (
              <IonButton onClick={addTestPDF} color="secondary">
                Add Test PDF
              </IonButton>
            )}
            <LogoutButton />
          </IonButtons>
        </IonToolbar>
        <IonToolbar>
          <IonSearchbar
            value={searchText}
            onIonChange={e => setSearchText(e.detail.value)}
            placeholder="Search PDFs..."
            animated={true}
            showClearButton="always"
          />
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="pdf-grid">
          {loading ? renderSkeletons() : (
            filteredPDFs.map((pdf) => (
              <IonCard key={pdf._id} className="pdf-card">
                <IonCardHeader>
                  <IonCardTitle>{pdf.title}</IonCardTitle>
                  <IonCardSubtitle>
                    <IonIcon icon={timeOutline} />
                    {formatDate(pdf.date)}
                  </IonCardSubtitle>
                </IonCardHeader>
                <IonCardContent>
                  <div className="pdf-text">{pdf.text}</div>
                  <div className="card-footer">
                    <IonChip outline>
                      <IonIcon icon={documentTextOutline} />
                      {pdf.text.length} characters
                    </IonChip>
                    <div className="button-group">
                      <IonButton
                        fill="clear"
                        onClick={() => handleGenerateManga(pdf)}
                        disabled={isGeneratingManga}
                      >
                        {isGeneratingManga ? (
                          <>
                            <IonSpinner name="crescent" />
                            <span className="loading-text">মাঙ্গা তৈরি হচ্ছে...</span>
                          </>
                        ) : (
                          <>
                            <IonIcon icon={imageOutline} slot="start" />
                            মাঙ্গা তৈরি করুন
                          </>
                        )}
                      </IonButton>
                      <IonButton
                        fill="clear"
                        onClick={() => handleDownload(pdf)}
                      >
                        <IonIcon icon={downloadOutline} slot="start" />
                        Download
                      </IonButton>
                      <IonButton
                        fill="clear"
                        color="secondary"
                        onClick={() => handleStartQuiz(pdf)}
                        disabled={isGeneratingQuiz}
                      >
                        {isGeneratingQuiz ? (
                          <>
                            <IonSpinner name="crescent" />
                            <span className="loading-text">কুইজ তৈরি হচ্ছে...</span>
                          </>
                        ) : (
                          'কুইজ শুরু করুন'
                        )}
                      </IonButton>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            ))
          )}
        </div>

        <IonInfiniteScroll
          onIonInfinite={handleInfiniteScroll}
          disabled={!hasMore || filteredPDFs.length < ITEMS_PER_PAGE}
        >
          <IonInfiniteScrollContent />
        </IonInfiniteScroll>

        <IonModal
          isOpen={showMangaModal}
          onDidDismiss={() => {
            setShowMangaModal(false);
            setCurrentPage(0);
          }}
          className="manga-modal"
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>{currentManga?.title}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowMangaModal(false)}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="manga-content">
            {currentManga && mangaPages.length > 0 && (
              <div className="manga-container">
                <div className="manga-navigation">
                  <IonButton
                    fill="clear"
                    onClick={handlePrevPage}
                    disabled={currentPage === 0}
                  >
                    পূর্ববর্তী
                  </IonButton>
                  <span className="page-indicator">
                    পৃষ্ঠা {currentPage + 1} / {mangaPages.length}
                  </span>
                  <IonButton
                    fill="clear"
                    onClick={handleNextPage}
                    disabled={currentPage === mangaPages.length - 1}
                  >
                    পরবর্তী
                  </IonButton>
                </div>
                <div className="manga-page">
                  <IonImg 
                    src={mangaPages[currentPage].image} 
                    alt={`পৃষ্ঠা ${currentPage + 1}`}
                  />
                  <div className="manga-text-container">
                    <div className="formula-box">
                      <h3>{mangaPages[currentPage].bengaliType}</h3>
                    </div>
                    <div className="manga-text bangla-text">
                      {mangaPages[currentPage].text}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </IonContent>
        </IonModal>

        <IonModal isOpen={showQuizModal} onDidDismiss={() => setShowQuizModal(false)}>
          <IonHeader>
            <IonToolbar color="primary">
              <IonTitle>কুইজ</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowQuizModal(false)}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            {quizData && !showResults && (
              <div className="quiz-container">
                <h2>প্রশ্ন {currentQuestion + 1} / {quizData.questions.length}</h2>
                <div className="question-box">
                  <p>{quizData.questions[currentQuestion].question}</p>
                </div>
                <div className="options-container">
                  {quizData.questions[currentQuestion].options.map((option, index) => (
                    <IonButton
                      key={index}
                      expand="block"
                      color={answers[currentQuestion] === option ? "secondary" : "medium"}
                      onClick={() => handleAnswerSelect(option)}
                      className="option-button"
                    >
                      {String.fromCharCode(65 + index)}. {option}
                    </IonButton>
                  ))}
                </div>
              </div>
            )}
            
            {showResults && (
              <div className="results-container">
                <h2>ফলাফল</h2>
                <div className="score-box">
                  <p>আপনার স্কোর: {calculateScore()} / {quizData.questions.length}</p>
                  <div className="answers-review">
                    {quizData.questions.map((question, index) => (
                      <div key={index} className={`answer-item ${answers[index] === question.correctAnswer ? 'correct' : 'incorrect'}`}>
                        <p className="question-text">{index + 1}. {question.question}</p>
                        <p className="answer-text">
                          আপনার উত্তর: {answers[index]}<br/>
                          সঠিক উত্তর: {question.correctAnswer}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                <IonButton
                  expand="block"
                  onClick={() => setShowQuizModal(false)}
                >
                  সমাপ্ত করুন
                </IonButton>
              </div>
            )}
          </IonContent>
        </IonModal>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
          position="bottom"
        />
      </IonContent>
    </IonPage>
  );
};

export default ContentManager;
