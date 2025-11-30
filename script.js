// ==========================================
// 1. DADOS & INICIALIZAÇÃO
// ==========================================
let questionsData = []; // Começa vazio

// Função para carregar o JSON
async function initApp() {
    try {
        const response = await fetch('./questions-json.json');
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        questionsData = await response.json();
        console.log("Perguntas carregadas com sucesso:", questionsData.length);
        
        // Ativar os botões
        document.getElementById('btn-start').disabled = false;
        document.getElementById('btn-list').disabled = false;
        
        // ✅ MOVER AQUI - Event listeners DEPOIS de carregar dados
        document.getElementById('btn-start').addEventListener('click', startQuiz);
        document.getElementById('btn-list').addEventListener('click', showList);
        document.getElementById('btn-home-quiz').addEventListener('click', () => switchScreen('start'));
        document.getElementById('btn-home-list').addEventListener('click', () => switchScreen('start'));
        document.getElementById('btn-hint').addEventListener('click', () => {
            document.getElementById('hint-text').classList.remove('hidden');
            document.getElementById('btn-hint').style.display = 'none';
        });
        
        document.querySelector('#start-screen p').innerText = "Data loaded. Let's goo!";

    } catch (error) {
        console.error("Erro loading JSON:", error);
        alert("Erro: JSON can't be read.");
    }
}

// Chamar a função assim que o script corre
initApp();

// ==========================================
// 2. ESTADO DA APP
// ==========================================
let currentQuestionIndex = 0;
let shuffledQuestions = [];
let score = 0;

// Elementos do DOM
const screens = {
    start: document.getElementById('start-screen'),
    quiz: document.getElementById('quiz-screen'),
    list: document.getElementById('list-screen')
};

// Verificar se todos os elementos foram encontrados
console.log("Screens loaded:", screens);

const ui = {
    questionText: document.getElementById('question-text'),
    optionsContainer: document.getElementById('options-container'),
    themeTag: document.getElementById('question-theme'),
    progressBar: document.getElementById('progress-bar'),
    countText: document.getElementById('question-count'),
    hintBtn: document.getElementById('btn-hint'),
    hintText: document.getElementById('hint-text'),
    feedbackArea: document.getElementById('feedback-area'),
    shortExpl: document.getElementById('short-explanation'),
    longExplDetails: document.getElementById('long-explanation'),
    longExplText: document.getElementById('long-expl-text'),
    nextBtn: document.getElementById('btn-next'),
    listContainer: document.getElementById('full-list-container')
};

// ==========================================
// 3. NAVEGAÇÃO E INICIALIZAÇÃO
// ==========================================
function switchScreen(screenName) {
    // Remover active de todos
    Object.values(screens).forEach(s => s?.classList.remove('active'));
    
    setTimeout(() => {
        // Esconder todos
        Object.values(screens).forEach(s => s?.classList.add('hidden'));
        
        // Mostrar apenas o novo
        const newScreen = screens[screenName];
        if (newScreen) {
            newScreen.classList.remove('hidden');
            setTimeout(() => newScreen.classList.add('active'), 50);
        }
    }, 400);
}
// ==========================================
// 4. LÓGICA DO QUIZ
// ==========================================
function startQuiz() {
    // Baralhar as perguntas para ser sempre novo
    shuffledQuestions = [...questionsData].sort(() => Math.random() - 0.5);
    currentQuestionIndex = 0;
    score = 0;
    switchScreen('quiz');
    loadQuestion();
}

function loadQuestion() {
    resetState();
    const question = shuffledQuestions[currentQuestionIndex];

    // Atualizar UI
    ui.themeTag.innerText = question.tema || 'Geral';
    ui.questionText.innerText = question.pergunta;
    ui.countText.innerText = `${currentQuestionIndex + 1} / ${shuffledQuestions.length}`;
    
    const progress = ((currentQuestionIndex) / shuffledQuestions.length) * 100;
    ui.progressBar.style.width = `${progress}%`;

    // Gerar Opções
    question.opcoes.forEach(opt => {
        const button = document.createElement('button');
        button.innerText = opt;
        button.classList.add('option-btn');
        button.addEventListener('click', () => selectAnswer(button, opt, question));
        ui.optionsContainer.appendChild(button);
    });

    // Configurar Hint
    ui.hintText.innerText = question.hint || "No clue available.";
}

function resetState() {
    ui.optionsContainer.innerHTML = '';
    ui.feedbackArea.classList.add('hidden');
    ui.hintText.classList.add('hidden');
    ui.hintBtn.style.display = 'block';
    ui.longExplDetails.removeAttribute('open'); // Fechar acordeão
    
    // Reabilitar botões
    const options = document.querySelectorAll('.option-btn');
    options.forEach(btn => btn.disabled = false);
}


function selectAnswer(selectedButton, selectedOption, question) {
    const isCorrect = selectedOption === question.resposta_correta;
    
    // Desabilitar todos os botões
    const allOptions = document.querySelectorAll('.option-btn');
    allOptions.forEach(btn => {
        btn.disabled = true;
        // Mostrar a correta sempre, mesmo se errou
        if (btn.innerText === question.resposta_correta) {
            btn.classList.add('correct');
        }
    });

    if (isCorrect) {
        score++;
        // Confetti ou som podia entrar aqui ;)
    } else {
        selectedButton.classList.add('wrong');
    }

    showExplanation(question);
}

function showExplanation(question) {
    ui.feedbackArea.classList.remove('hidden');
    
    // Explicação Curta
    ui.shortExpl.innerHTML = `<strong>Answer:</strong> ${question.short_explanation || "No short explanation."}`;
    
    // Explicação Longa
    ui.longExplText.innerText = question.long_explanation || "Without aditional details.";

    // Lógica do botão Next
    ui.nextBtn.onclick = () => {
        currentQuestionIndex++;
        if (currentQuestionIndex < shuffledQuestions.length) {
            loadQuestion();
        } else {
            finishQuiz();
        }
    };
}

function finishQuiz() {
    ui.questionText.innerText = `Quiz Terminado! 🎉`;
    ui.optionsContainer.innerHTML = `
        <div style="text-align:center">
            <h3>A tua pontuação: ${score} de ${shuffledQuestions.length}</h3>
            <p style="color: var(--text-muted); margin-top: 10px;">Not too shabby!</p>
        </div>
    `;
    ui.feedbackArea.classList.add('hidden');
    ui.hintBtn.style.display = 'none';
    ui.themeTag.innerText = 'Resultados';
    
    // Criar botão de reiniciar
    const restartBtn = document.createElement('button');
    restartBtn.innerText = "Jogar Novamente";
    restartBtn.classList.add('btn', 'primary', 'full-width');
    restartBtn.onclick = startQuiz;
    ui.optionsContainer.appendChild(restartBtn);
}

// ==========================================
// 5. MODO LISTA (ESTUDO)
// ==========================================
function showList() {
    switchScreen('list');
    ui.listContainer.innerHTML = ''; // Limpar

    questionsData.forEach((q, index) => {
        const item = document.createElement('div');
        item.classList.add('list-item');
        item.innerHTML = `
            <h3>${index + 1}. ${q.pergunta}</h3>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin: 5px 0;">${q.tema}</p>
            <div style="margin-top: 8px; font-weight: 600; color: var(--success)">A: ${q.resposta_correta}</div>
            <details style="margin-top: 10px; cursor: pointer;">
                <summary style="font-size: 0.8rem; color: var(--accent);">Ver Explicação</summary>
                <p style="font-size: 0.85rem; margin-top: 5px; color: var(--text-muted); line-height:1.2rem">${q.long_explanation}</p>
            </details>
        `;
        ui.listContainer.appendChild(item);
    });
}