// Quiz logic (only runs on interactive.html)
function evaluateQuiz() {
    const answers = {
        q1: 'loktak',
        q2: 'rasleela',
        q3: 'sangai'
    };

    let score = 0;
    let total = Object.keys(answers).length;

    Object.keys(answers).forEach(q => {
        const selected = document.querySelector(`input[name="${q}"]:checked`);
        if (selected && selected.value === answers[q]) {
            score++;
        }
    });

    const resultEl = document.getElementById('quiz-result');
    if (resultEl) {
        resultEl.textContent = `You scored ${score} out of ${total}.`;
        if (score === total) {
            resultEl.textContent += ' Beautiful! You really know Manipur.';
        } else if (score === 0) {
            resultEl.textContent += ' No worries, every journey starts somewhere.';
        }
    }
}

const quizButton = document.getElementById('quiz-submit');
if (quizButton) {
    quizButton.addEventListener('click', evaluateQuiz);
}

// Simple month chips for festivals (interactive.html)
const monthChips = document.querySelectorAll('.month-chip');
const monthInfo = document.getElementById('month-info');

if (monthChips && monthChips.length > 0 && monthInfo) {
    monthChips.forEach(chip => {
        chip.addEventListener('click', () => {
            monthChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');

            const month = chip.dataset.month;
            let text = '';

            // You can customize more festivals here
            switch (month) {
                case 'feb':
                    text = 'Yaoshang: Five-day festival with sports, music, and Thabal Chongba.';
                    break;
                case 'apr':
                    text = 'Cheiraoba: Manipuri New Year, families climb nearby hills for good fortune.';
                    break;
                case 'may':
                    text = 'Lai Haraoba: Celebration of traditional deities with dance and rituals.';
                    break;
                default:
                    text = 'Add a short note about major festivals in this month.';
            }

            monthInfo.textContent = text;
        });
    });
}
