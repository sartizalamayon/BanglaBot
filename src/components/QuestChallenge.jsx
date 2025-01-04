import React, { useState, useEffect } from 'react';
import {
  IonCard,
  IonButton,
  IonProgressBar,
  IonIcon,
  IonText,
} from '@ionic/react';
import { checkmarkCircle, closeCircle } from 'ionicons/icons';

const QuestChallenge = ({ quest, onComplete, region }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState(0);

  const handleAnswer = (answer) => {
    setSelectedAnswer(answer);
    const correct = answer === quest.challenges[currentStep].correctAnswer;
    setIsCorrect(correct);
    if (correct) setScore(score + 1);

    // Wait before moving to next question
    setTimeout(() => {
      if (currentStep < quest.challenges.length - 1) {
        setCurrentStep(currentStep + 1);
        setSelectedAnswer(null);
        setIsCorrect(null);
      } else {
        // Quest completed
        onComplete({
          score,
          totalQuestions: quest.challenges.length,
          region: region.name,
        });
      }
    }, 1500);
  };

  return (
    <div className="quest-challenge">
      <div className="challenge-header">
        <h2>{quest.title}</h2>
        <p>প্রশ্ন {currentStep + 1}/{quest.challenges.length}</p>
      </div>

      <div className="challenge-content">
        {quest.challenges[currentStep].type === 'vocabulary' && (
          <VocabularyChallenge 
            challenge={quest.challenges[currentStep]}
            onAnswer={handleAnswer}
            selectedAnswer={selectedAnswer}
            isCorrect={isCorrect}
          />
        )}

        {quest.challenges[currentStep].type === 'conversation' && (
          <ConversationChallenge 
            challenge={quest.challenges[currentStep]}
            onAnswer={handleAnswer}
            selectedAnswer={selectedAnswer}
            isCorrect={isCorrect}
          />
        )}

        {quest.challenges[currentStep].type === 'cultural' && (
          <CulturalChallenge 
            challenge={quest.challenges[currentStep]}
            onAnswer={handleAnswer}
            selectedAnswer={selectedAnswer}
            isCorrect={isCorrect}
          />
        )}

        <div className="challenge-progress">
          <IonProgressBar 
            value={(currentStep + 1) / quest.challenges.length}
            color={region.color}
          />
          <p>স্কোর: {score}/{quest.challenges.length}</p>
        </div>
      </div>
    </div>
  );
};

const VocabularyChallenge = ({ challenge, onAnswer, selectedAnswer, isCorrect }) => (
  <div className="vocabulary-challenge">
    <h3>{challenge.word}</h3>
    <p className="word-context">{challenge.context}</p>
    <div className="challenge-options">
      {challenge.options.map((option, index) => (
        <IonButton
          key={index}
          expand="block"
          fill="outline"
          className={`challenge-option ${selectedAnswer === option ? 'selected' : ''}`}
          disabled={selectedAnswer !== null}
          onClick={() => onAnswer(option)}
        >
          {option}
          {selectedAnswer === option && (
            <IonIcon 
              icon={isCorrect ? checkmarkCircle : closeCircle}
              color={isCorrect ? "success" : "danger"}
              slot="end"
            />
          )}
        </IonButton>
      ))}
    </div>
  </div>
);

const ConversationChallenge = ({ challenge, onAnswer, selectedAnswer, isCorrect }) => (
  <div className="conversation-challenge">
    <div className="dialogue">
      {challenge.dialogue.map((line, index) => (
        <div key={index} className={`dialogue-line ${line.speaker}`}>
          <strong>{line.speaker}:</strong> {line.text}
        </div>
      ))}
    </div>
    <h3>{challenge.question}</h3>
    <div className="challenge-options">
      {challenge.options.map((option, index) => (
        <IonButton
          key={index}
          expand="block"
          fill="outline"
          className={`challenge-option ${selectedAnswer === option ? 'selected' : ''}`}
          disabled={selectedAnswer !== null}
          onClick={() => onAnswer(option)}
        >
          {option}
          {selectedAnswer === option && (
            <IonIcon 
              icon={isCorrect ? checkmarkCircle : closeCircle}
              color={isCorrect ? "success" : "danger"}
              slot="end"
            />
          )}
        </IonButton>
      ))}
    </div>
  </div>
);

const CulturalChallenge = ({ challenge, onAnswer, selectedAnswer, isCorrect }) => (
  <div className="cultural-challenge">
    <div className="story-content">
      <h3>{challenge.title}</h3>
      <p>{challenge.story}</p>
    </div>
    <h3>{challenge.question}</h3>
    <div className="challenge-options">
      {challenge.options.map((option, index) => (
        <IonButton
          key={index}
          expand="block"
          fill="outline"
          className={`challenge-option ${selectedAnswer === option ? 'selected' : ''}`}
          disabled={selectedAnswer !== null}
          onClick={() => onAnswer(option)}
        >
          {option}
          {selectedAnswer === option && (
            <IonIcon 
              icon={isCorrect ? checkmarkCircle : closeCircle}
              color={isCorrect ? "success" : "danger"}
              slot="end"
            />
          )}
        </IonButton>
      ))}
    </div>
  </div>
);

export default QuestChallenge;
