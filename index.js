class MoodTracker {
    constructor() {
        this.selectedMood = null;
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.updateUI();
    }

    setupEventListeners() {
        // Mood button selection
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.addEventListener('click', () => this.selectMood(btn));
        });

        // Submit button
        document.getElementById('submitBtn').addEventListener('click', () => this.logMood());

        // Clear button
        document.getElementById('clearBtn').addEventListener('click', () => this.clearAllData());

        // Enter key in textarea
        document.getElementById('moodNote').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.logMood();
            }
        });
    }

    selectMood(btn) {
        // Remove previous selection
        document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
        
        // Add selection to clicked button
        btn.classList.add('selected');
        this.selectedMood = {
            emoji: btn.dataset.mood,
            value: parseInt(btn.dataset.value)
        };
    }

    logMood() {
        if (!this.selectedMood) {
            alert('Please select a mood first!');
            return;
        }

        const note = document.getElementById('moodNote').value;
        const today = this.getDateKey();
        
        const entry = {
            date: today,
            timestamp: new Date().toISOString(),
            mood: this.selectedMood.value,
            emoji: this.selectedMood.emoji,
            note: note
        };

        // Save to localStorage
        let entries = JSON.parse(localStorage.getItem('moodEntries')) || [];
        
        // Remove existing entry for today
        entries = entries.filter(e => e.date !== today);
        
        // Add new entry
        entries.push(entry);
        localStorage.setItem('moodEntries', JSON.stringify(entries));

        // Reset UI
        this.selectedMood = null;
        document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
        document.getElementById('moodNote').value = '';

        // Update display
        this.updateUI();
        
        alert('Mood logged successfully! 📝');
    }

    loadData() {
        // This loads from localStorage automatically when needed
        return JSON.parse(localStorage.getItem('moodEntries')) || [];
    }

    getDateKey() {
        const today = new Date();
        return today.toISOString().split('T')[0]; // YYYY-MM-DD format
    }

    getWeekStart() {
        const today = new Date();
        const day = today.getDay();
        const diff = today.getDate() - day; // Adjust when day is Sunday
        return new Date(today.setDate(diff));
    }

    getThisWeekEntries() {
        const weekStart = this.getWeekStart();
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const entries = this.loadData();
        return entries.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate >= weekStart && entryDate <= weekEnd;
        });
    }

    updateUI() {
        this.updateTodayEntry();
        this.updateWeeklySummary();
    }

    updateTodayEntry() {
        const today = this.getDateKey();
        const entries = this.loadData();
        const todayEntry = entries.find(e => e.date === today);

        const todayDiv = document.getElementById('todayEntry');
        
        if (todayEntry) {
            document.getElementById('todayMood').textContent = todayEntry.emoji;
            const noteEl = document.getElementById('todayNote');
            noteEl.textContent = todayEntry.note ? `"${todayEntry.note}"` : '';
            todayDiv.style.display = 'block';
        } else {
            todayDiv.style.display = 'none';
        }
    }

    updateWeeklySummary() {
        const weekEntries = this.getThisWeekEntries();

        if (weekEntries.length === 0) {
            document.getElementById('avgMood').textContent = '-';
            document.getElementById('bestDay').textContent = '-';
            document.getElementById('entryCount').textContent = '0';
            this.renderChart([]);
            this.renderEntries([]);
            return;
        }

        // Calculate average mood
        const avgMood = (weekEntries.reduce((sum, e) => sum + e.mood, 0) / weekEntries.length).toFixed(1);
        document.getElementById('avgMood').textContent = avgMood;

        // Find best day
        const bestEntry = weekEntries.reduce((best, current) => 
            current.mood > best.mood ? current : best
        );
        document.getElementById('bestDay').textContent = this.formatDate(bestEntry.date);

        // Entry count
        document.getElementById('entryCount').textContent = weekEntries.length;

        // Render chart and entries
        this.renderChart(weekEntries);
        this.renderEntries(weekEntries.reverse());
    }

    renderChart(entries) {
        const weekStart = this.getWeekStart();
        const chartDays = [];

        for (let i = 0; i < 7; i++) {
            const day = new Date(weekStart);
            day.setDate(day.getDate() + i);
            const dateKey = day.toISOString().split('T')[0];
            
            const dayEntry = entries.find(e => e.date === dateKey);
            chartDays.push({
                date: dateKey,
                day: day.toLocaleDateString('en-US', { weekday: 'short' }),
                mood: dayEntry ? dayEntry.mood : 0,
                emoji: dayEntry ? dayEntry.emoji : '-'
            });
        }

        const chartHTML = chartDays.map(day => `
            <div class="day-bar">
                <div class="bar" style="height: ${day.mood * 20}px;" title="${day.emoji || 'No entry'}"></div>
                <div class="day-label">${day.day}</div>
            </div>
        `).join('');

        document.getElementById('weekChart').innerHTML = chartHTML;
    }

    renderEntries(entries) {
        if (entries.length === 0) {
            document.getElementById('entriesList').innerHTML = 
                '<div class="empty-message">No entries this week. Start tracking your mood! 😊</div>';
            return;
        }

        const entriesHTML = entries.map(entry => `
            <div class="entry-item">
                <span class="entry-date">${this.formatDateFull(entry.date)}</span>
                <span class="entry-mood">${entry.emoji}</span>
                ${entry.note ? `<span>${entry.note}</span>` : ''}
            </div>
        `).join('');

        document.getElementById('entriesList').innerHTML = entriesHTML;
    }

    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }

    formatDateFull(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }

    clearAllData() {
        if (confirm('Are you sure you want to delete all mood data? This cannot be undone.')) {
            localStorage.removeItem('moodEntries');
            this.selectedMood = null;
            document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
            document.getElementById('moodNote').value = '';
            this.updateUI();
            alert('All data cleared!');
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MoodTracker();
});