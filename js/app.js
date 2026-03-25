document.addEventListener("DOMContentLoaded", function(){

const canvas = document.getElementById("intro-canvas");

if(!canvas) return;

const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const particles = [];

for(let i=0;i<120;i++){

particles.push({

x:Math.random()*canvas.width,
y:Math.random()*canvas.height,

vx:(Math.random()-0.5)*3,
vy:(Math.random()-0.5)*3,

char:letters[Math.floor(Math.random()*letters.length)]

});

}

function animate(){

ctx.clearRect(0,0,canvas.width,canvas.height);

ctx.fillStyle="white";
ctx.font="20px monospace";

particles.forEach(p=>{

p.x+=p.vx;
p.y+=p.vy;

if(p.x<0||p.x>canvas.width) p.vx*=-1;
if(p.y<0||p.y>canvas.height) p.vy*=-1;

ctx.fillText(p.char,p.x,p.y);

});

requestAnimationFrame(animate);

}

animate();

setTimeout(()=>{

document.getElementById("intro-title").classList.add("show");

},2500);

setTimeout(()=>{

const intro=document.getElementById("intro-screen");

intro.style.opacity="0";
intro.style.transition="1s";

setTimeout(()=>{

intro.remove();

},1000);

},6000);

});

document.addEventListener("DOMContentLoaded", () => {
    const pageContents = document.querySelectorAll('.page-content');
    
   

    navLinks.forEach(link => {
  link.addEventListener("click", function(e) {
    const targetPage = e.currentTarget.getAttribute("data-page");

            // Hide all pages
            pageContents.forEach(page => page.classList.add("hidden"));

            // Show selected page
            const page = document.getElementById(`${targetPage}-page`);
            if(page) page.classList.remove("hidden");

            // Update active style
            navLinks.forEach(l => l.classList.remove("active"));
            link.classList.add("active");

        });

    });

});
    
    // --- UI/Modal Logic ---
    const welcomeModal = document.getElementById('welcome-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const detailsForm = document.getElementById('details-form');
    const suggestionsOutput = document.getElementById('suggestions-output');
    const statusModal = document.getElementById('status-modal');
    const statusText = document.getElementById('status-text');
    const loaderSpinner = document.getElementById('loader-spinner');
    const closeStatusModalBtn = document.getElementById('close-status-modal');
    const generateButton = document.getElementById('generate-button');
    const navLinks = document.querySelectorAll('.nav-link');
    const pageContents = document.querySelectorAll('.page-content');
    
     // NEW ELEMENTS FOR START BUTTON
    const startFormBtn = document.getElementById('start-form-btn');
    const formWrapper = document.getElementById('form-wrapper');


     // Chatbot elements (DOM present above)
    const chatBtn = document.getElementById('chatbot-btn');
    const chatWin = document.getElementById('chatbot-window');
    const closeChat = document.getElementById('close-chat');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendChat = document.getElementById('send-chat');
    
   
    // Function to update the profile page UI (moved from module scope to global scope in the script)
    function updateProfilePage(userId, isFallback = false) {
        const userIdDisplay = document.getElementById('user-id-display');
        if (userIdDisplay) {
            userIdDisplay.textContent = userId;
            if (isFallback) {
                userIdDisplay.classList.add('text-red-500');
                userIdDisplay.textContent += " (Read-only session)";
            } else {
                userIdDisplay.classList.remove('text-red-500');
            }
        }
    }

    // Show Welcome Modal on load
    document.addEventListener('DOMContentLoaded', () => {
        const hasVisited = localStorage.getItem('scaffold_visited');
        if (hasVisited) {
            welcomeModal.classList.remove('hidden');
        }
        
        // Initial check for userId if script loaded before Firebase module finished
        if (window.appUserId) {
             updateProfilePage(window.appUserId);
        }
    });

    closeModalBtn.addEventListener('click', () => {
        welcomeModal.classList.add('hidden');
        localStorage.setItem('scaffold_visited', 'true');
    });

    closeStatusModalBtn.addEventListener('click', () => {
        statusModal.classList.add('hidden');
    });
    
    // NEW: Handle "Let's Get Started!" button click
    if (startFormBtn && formWrapper) {
        startFormBtn.addEventListener('click', () => {
            // 1. Show the form
            formWrapper.classList.remove('hidden');
            // 2. Hide the start button
            startFormBtn.parentElement.classList.add('hidden');
            // 3. Scroll to the new form for better UX
            formWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    // Navigation Logic (Unchanged)
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPage = e.target.getAttribute('data-page');

            navLinks.forEach(nav => nav.classList.remove('active'));
            e.target.classList.add('active');

            pageContents.forEach(page => {
                if (page.id === `${targetPage}-page`) {
                    page.classList.remove('hidden');
                    // Special call for profile page to ensure ID is displayed
                    if (targetPage === 'profile' && window.appUserId) {
                        updateProfilePage(window.appUserId);
                    }
                } else {
                    page.classList.add('hidden');
                }
            });
        });
    });

    // Function to show/hide the status modal
    function showStatus(text, isLoading = true, isError = false) {
        statusText.textContent = text;
        statusModal.classList.remove('hidden');
        loaderSpinner.classList.toggle('hidden', !isLoading);
        closeStatusModalBtn.classList.toggle('hidden', isLoading);
        
        if (isError) {
            statusText.classList.add('text-red-600');
            statusText.classList.remove('text-gray-700');
        } else {
            statusText.classList.add('text-gray-700');
            statusText.classList.remove('text-red-600');
        }
        generateButton.disabled = isLoading;
    }

    // --- Core API Logic (Gemini) ---

    // Structured output schema now expects an ARRAY of activities
    const responseSchema = {
        type: "ARRAY",
        description: "An array containing three distinct creative activity suggestions.",
        items: {
            type: "OBJECT",
            properties: {
                title: {
                    type: "STRING",
                    description: "A short, catchy title for the activity (The Next Ladder Up!)."
                },
                focusArea: {
                    type: "STRING",
                    description: "The primary developmental skill focused on (e.g., Fine Motor Skills, Abstract Thinking, Rhythmic Awareness)."
                },
                materials: {
                    type: "ARRAY",
                    items: { type: "STRING" },
                    description: "A list of materials needed, derived from the child's preferences if possible."
                },
                steps: {
                    type: "ARRAY",
                    items: { type: "STRING" },
                    description: "Step-by-step instructions for the parent/guardian to guide the activity (4-6 steps)."
                },
                whyItWorks: {
                    type: "STRING",
                    description: "A brief, encouraging explanation (1-2 sentences) of how this activity helps the child's creative development."
                }
            },
            required: ["title", "focusArea", "materials", "steps", "whyItWorks"]
        }
    };

    

    async function generateActivitySuggestions(age, location, preferences) {
        // Updated text here
        showStatus('Creating the ladder...'); 
        
        const systemPrompt = `Act as a world-class early childhood education expert and creative curriculum designer. Your goal is to generate three separate, distinct, detailed, age-appropriate, and engaging creative activity suggestions (Ladders) based on the user's input. The response must be structured as a JSON array containing three activity objects.`;
        
        const userQuery = `Generate three creative activities for a child in the age group: "${age}". All activities must be suitable for the environment: "${location}". All activities should be personalized based on the child's unique interests and available resources: "${preferences}". Ensure each activity focuses on a different developmental aspect and is easy to understand and safe for the specified age group.`;
        
        try {
            const response = await fetch("https://scaffold-backend-1.onrender.com/generate", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        age,
        location,
        preferences
    })
});

const result = await response.json();
console.log("FULL BACKEND RESPONSE:", result);

const jsonString = result.candidates?.[0]?.content?.parts?.[0]?.text;

if (!jsonString) {
    throw new Error("No content generated by the AI model.");
}

let activities;

try {
    activities = JSON.parse(jsonString);
} catch (e) {
    console.error("JSON Parse Failed:", jsonString);
    throw new Error("AI returned invalid JSON format");
}

if (!Array.isArray(activities) || activities.length === 0) {
    throw new Error("Invalid activity format.");
}

renderActivities(activities);

        } catch (error) {
            console.error("Gemini API or Parsing Error:", error);
            showStatus(`Error generating activities: ${error.message}. Please try again.`, false, true);
        } finally {
            if (statusText.classList.contains('text-gray-700')) {
                 statusModal.classList.add('hidden'); // Hide only if no error occurred
            }
           
        }
    }
    
    // Renders a single activity card
    function renderSingleActivity(activity, index) {
        return `
            <div class="suggestion-card p-6 space-y-4">
                <div class="flex items-center justify-between border-b pb-2 mb-3">
                    <h3 class="text-2xl font-extrabold text-[#20B2AA]">
                        <span class="text-[#FFD700] mr-1">${index}.</span> ${activity.title}
                    </h3>
                    <div class="w-8 h-8 rounded-full flex items-center justify-center bg-[#20B2AA] text-white font-bold text-sm shadow-md">
                        #${index}
                    </div>
                </div>

                <div class="flex flex-wrap gap-2 text-xs font-medium">
                    <span class="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
                        Age: ${document.getElementById('child-age').value}
                    </span>
                    <span class="bg-blue-100 text-[#20B2AA] px-3 py-1 rounded-full">
                        Focus: ${activity.focusArea}
                    </span>
                </div>

                <div class="bg-white p-3 rounded-lg border border-gray-100">
                    <p class="text-gray-600 italic text-sm font-semibold">${activity.whyItWorks}</p>
                </div>

                <div>
                    <h4 class="font-bold text-gray-800 flex items-center mb-2 text-base">
                        Materials
                    </h4>
                    <ul class="list-disc list-inside space-y-1 text-gray-700 ml-4 text-sm">
                        ${activity.materials.map(m => `<li>${m}</li>`).join('')}
                    </ul>
                </div>

                <div>
                    <h4 class="font-bold text-gray-800 flex items-center mb-2 text-base mt-4">
                        Steps
                    </h4>
                    <ol class="list-decimal list-inside space-y-1 text-gray-700 ml-4 text-sm">
                        ${activity.steps.map(s => `<li>${s}</li>`).join('')}
                    </ol>
                </div>

            </div>
        `;
    }

    // Renders all activities in a responsive grid
    function renderActivities(activities) {
        suggestionsOutput.classList.add('fade-in');
        
        // Map over the array to create three cards
        const activityCards = activities.map((activity, index) => renderSingleActivity(activity, index + 1)).join('');
        
        suggestionsOutput.innerHTML = `
            <h2 class="text-3xl font-extrabold text-[#20B2AA] mb-6 border-b-4 border-[#FFD700] pb-3 text-center md:text-left">
                Your Three Personalized Ladders
            </h2>
            <div class="grid gap-8 md:grid-cols-3">
                ${activityCards}
            </div>
            <div class="mt-8 text-center text-gray-600 italic text-sm">
                These activities are designed to progressively challenge your child's creative development based on their current stage and interests. Choose the ladder that looks most fun!
            </div>
        `;
    }

    detailsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const age = document.getElementById('child-age').value;
        const location = document.getElementById('activity-location').value;
        const preferences = document.getElementById('child-preferences').value;

        if (!age || !location || !preferences) {
            showStatus("Please fill out all three 'Ladder' fields before generating.", false, true);
            return;
        }

        generateActivitySuggestions(age, location, preferences);
    });

const container = document.getElementById('ascii-container');
const asciiChars = ["(ง'̀-'́)ง", "𝄞", "♬", "ᝰ🖌", "✎", "𓀤𓀥", "𐦂𖨆𐀪𖠋", "𖣘","🗪 ","⏲"," 🗣", "🛣","[◉°] "," ō͡≡о ","S","C","A","F","F","O","L","D", ]; // your ASCII characters
const maxAscii = 50;
function createAscii() {

    if(container.children.length >= maxAscii) return;
    const span = document.createElement('span');
    span.className = 'ascii';
    span.textContent = asciiChars[Math.floor(Math.random() * asciiChars.length)];
    
    // Random initial position
    span.style.left = Math.random() * window.innerWidth + 'px';
    span.style.top = "-20px";
    span.style.fontSize = (Math.random() * 20 + 10) + 'px';
    span.style.animationDuration = (Math.random() * 8 + 4) + 's';
    
    container.appendChild(span);

    // Remove element after animation completes
    span.addEventListener('animationend', () => span.remove());
}

// Generate new ASCII every 200ms
setInterval(createAscii, Math.random()*800 + 400);

const c = document.getElementById('paintTrail');
const ctx = c.getContext('2d');

function resize(){ c.width=innerWidth; c.height=innerHeight; }
resize(); addEventListener('resize',resize);

let strokes=[];
let mouse={x:innerWidth/2, y:innerHeight/2};
let last={...mouse};

addEventListener('mousemove',e=>{
  mouse.x=e.clientX; mouse.y=e.clientY;
});

function addStroke(x,y){
  strokes.push({
    x, y,
    r:Math.random()*20+18,
    life:1
  });
}


function draw(){

  // interpolate between last and current cursor to fill the path
  const dx=mouse.x-last.x, dy=mouse.y-last.y;
  const steps=Math.max(1,Math.hypot(dx,dy)/5);
  for(let i=0;i<steps;i++){
    const t=i/steps;
    addStroke(last.x+dx*t,last.y+dy*t);
  }
  last.x=mouse.x; last.y=mouse.y;

  ctx.clearRect(0,0,c.width,c.height);
  strokes.forEach(s=>{
    const grad=ctx.createRadialGradient(s.x,s.y,0,s.x,s.y,s.r);
    grad.addColorStop(0,`rgba(0,0,0,${s.life})`);
    grad.addColorStop(0.4,`rgba(0,0,0,${s.life*0.3})`);
    grad.addColorStop(1,'rgba(0,225,225,225)');

    ctx.filter='blur(15px)';
    ctx.globalCompositeOperation='lighter';
    ctx.fillStyle=grad;
    ctx.beginPath(); ctx.arc(s.x,s.y,s.r,5,2*Math.PI*1); ctx.fill();

    s.life-=0.30;          // slower fade for continuous feel
  });

  strokes=strokes.filter(s=>s.life>0);
  requestAnimationFrame(draw);
}
draw();

