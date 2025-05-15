document.addEventListener('DOMContentLoaded', () => {
    const timerDisplay = document.getElementById('timer');
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resetBtn = document.getElementById('resetBtn');
    const pomodoroTimeInput = document.getElementById('pomodoroTime');
    const shortBreakTimeInput = document.getElementById('shortBreakTime');
    const longBreakTimeInput = document.getElementById('longBreakTime');
    const statusDisplay = document.getElementById('status');
  
    let timer;
    let timeLeft = 25 * 60; // Default 25 minutes in seconds
    let isRunning = false;
    let isPaused = false;
    let currentMode = 'pomodoro'; // 'pomodoro', 'shortBreak', 'longBreak'
    let pomodoroCount = 0;
  
    // Load saved settings
    chrome.storage.sync.get(['pomodoroTime', 'shortBreakTime', 'longBreakTime'], (data) => {
      if (data.pomodoroTime) pomodoroTimeInput.value = data.pomodoroTime;
      if (data.shortBreakTime) shortBreakTimeInput.value = data.shortBreakTime;
      if (data.longBreakTime) longBreakTimeInput.value = data.longBreakTime;
      updateTimerDisplay();
    });
  
    // Update timer display
    function updateTimerDisplay() {
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      
      // Update browser icon badge
      chrome.action.setBadgeText({ text: `${minutes}` });
    }
  
    // Start timer
    function startTimer() {
      if (!isRunning) {
        isRunning = true;
        isPaused = false;
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        
        timer = setInterval(() => {
          timeLeft--;
          updateTimerDisplay();
          
          if (timeLeft <= 0) {
            clearInterval(timer);
            isRunning = false;
            notifyCompletion();
            switchMode();
          }
        }, 1000);
      }
    }
  
    // Pause timer
    function pauseTimer() {
      if (isRunning && !isPaused) {
        clearInterval(timer);
        isPaused = true;
        pauseBtn.textContent = 'Resume';
      } else if (isPaused) {
        startTimer();
        pauseBtn.textContent = 'Pause';
      }
    }
  
    // Reset timer
    function resetTimer() {
      clearInterval(timer);
      isRunning = false;
      isPaused = false;
      startBtn.disabled = false;
      pauseBtn.disabled = true;
      pauseBtn.textContent = 'Pause';
      
      // Save settings
      const settings = {
        pomodoroTime: pomodoroTimeInput.value,
        shortBreakTime: shortBreakTimeInput.value,
        longBreakTime: longBreakTimeInput.value
      };
      chrome.storage.sync.set(settings);
      
      // Reset to current mode's time
      setModeTime();
      updateTimerDisplay();
    }
  
    // Switch between pomodoro/break modes
    function switchMode() {
      if (currentMode === 'pomodoro') {
        pomodoroCount++;
        if (pomodoroCount % 4 === 0) {
          currentMode = 'longBreak';
          statusDisplay.textContent = 'Time for a long break!';
        } else {
          currentMode = 'shortBreak';
          statusDisplay.textContent = 'Time for a short break!';
        }
      } else {
        currentMode = 'pomodoro';
        statusDisplay.textContent = 'Time to work!';
      }
      
      setModeTime();
      updateTimerDisplay();
      startTimer();
    }
  
    // Set time based on current mode
    function setModeTime() {
      if (currentMode === 'pomodoro') {
        timeLeft = parseInt(pomodoroTimeInput.value) * 60;
      } else if (currentMode === 'shortBreak') {
        timeLeft = parseInt(shortBreakTimeInput.value) * 60;
      } else {
        timeLeft = parseInt(longBreakTimeInput.value) * 60;
      }
    }
  
    // Show notification when timer completes
    function notifyCompletion() {
      let notificationMessage = '';
      if (currentMode === 'pomodoro') {
        notificationMessage = 'Pomodoro completed! Time for a break.';
      } else {
        notificationMessage = 'Break completed! Time to get back to work.';
      }
      
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Pomodoro Timer',
        message: notificationMessage
      });
    }
  
    // Event listeners
    startBtn.addEventListener('click', startTimer);
    pauseBtn.addEventListener('click', pauseTimer);
    resetBtn.addEventListener('click', resetTimer);
    
    // Update timer when settings change
    [pomodoroTimeInput, shortBreakTimeInput, longBreakTimeInput].forEach(input => {
      input.addEventListener('change', () => {
        if (!isRunning) {
          setModeTime();
          updateTimerDisplay();
        }
      });
    });
  });