"use strict";

// DOM Elements
const output           = document.querySelector('.output');
const img              = document.getElementById('image');
const loadButton       = document.getElementById('load-button');
const bookSelect       = document.getElementById('book');
const chapterSelect    = document.getElementById('chapter');
const tetraSelect      = document.getElementById('tetra');
const pronounsCheckbox = document.getElementById('pronouns');
const latinaCheckbox   = document.getElementById('latinamode');

// Initialize application
document.addEventListener('DOMContentLoaded', async () => {
    // Set up event listeners
    loadButton.addEventListener('click', loadChap);
    bookSelect.addEventListener('change', getChapters);
    chapterSelect.addEventListener('change', loadChap);
    tetraSelect.addEventListener('change', updateDisplay);
    pronounsCheckbox.addEventListener('change', updateDisplay);
    latinaCheckbox.addEventListener('change', updateDisplay);

    // Populate book dropdown box
    await getBooks();
    // Populate chapters dropdown box
    await getChapters();
    // Load initial content, defaults to Gen 1:1
    await loadChap();
});

async function loadJSON(file) {
    try {
        const response = await fetch(file);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        const fragment = document.createDocumentFragment();

        // Get total chapters for the selected book
        const selectedBookOption = document.querySelector(`#book option[value="${bookSelect.value}"]`);
        const totalChapters = parseInt(selectedBookOption?.dataset.chapters) || 1;

        // Create heading
        const [firstVerse] = data.verses;
        const bookName = firstVerse.book_name === "Psalms"
            ? "Psalm" // Use singular "Psalm" in heading
            : firstVerse.book_name;
        const chapterNumber = firstVerse.chapter;

        const heading = document.createElement('h3');
        heading.textContent = totalChapters > 1
            ? `${bookName} ${chapterNumber}` // Get book and chapter...
            : bookName; // ...or just book if only 1 chapter
        fragment.appendChild(heading);

        // Create verses
        data.verses.forEach(verse => {
            const p = document.createElement('p');
            p.innerHTML = `<span class="verse-num">${verse.verse}</span> ${verse.text}`; // Get verse number and text
            fragment.appendChild(p);
        });

        output.replaceChildren(fragment);
        updateDisplay();
    } catch (error) {
        console.error("Error loading JSON:", error);
        output.textContent = "Failed to load chapter. Please try again.";
    }
}

async function getBooks() {
    try {
        const manifest = await fetch('data/chapters.json');
        if (!manifest.ok) throw new Error('Failed to load books');

        const data = await manifest.json();

        // Clear existing options
        bookSelect.innerHTML = '';

        // Create options in specified order
        data.order.forEach(bookName => {
            const option = document.createElement('option');
            option.value = bookName;
            option.textContent = bookName;
            
            // Add chapter count as data attribute if needed
            option.dataset.chapters = data.chapters[bookName];
            
            bookSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading books:', error);
        bookSelect.innerHTML = '<option value="">Error</option>';
    }
}

async function getChapters() {
    try {
        chapterSelect.disabled = true;
        const manifest = await fetch('data/chapters.json');
        if (!manifest.ok) throw new Error('Failed to load chapters');

        const { chapters } = await manifest.json();
        const chaptersArray = Array.from({length: chapters[bookSelect.value]}, (_, i) => i + 1);

        // Clear existing options
        chapterSelect.innerHTML = '';

        // Add new options
        chaptersArray.forEach(chapter => {
            const option = document.createElement('option');
            option.value = chapter;
            option.textContent = `${chapter}`;
            chapterSelect.appendChild(option);
        });

        if (chaptersArray.length > 1) // Keep dropdown disabled if only 1 chapter
            chapterSelect.disabled = false;
    } catch (error) {
        console.error('Error loading chapters:', error);
        chapterSelect.innerHTML = '<option value="">Error</option>';
    }
}

async function loadChap() {
    const book = bookSelect.value;
    const chapter = chapterSelect.value;

    if (!book || !chapter) {
        output.textContent = "Error selecting book and chapter";
        return;
    }

    const file = `data/${book}/${chapter}.json`;
    loadJSON(file);
  }

function updateDisplay() {
    if (!output.children.length) return; // No content yet

    const tetraValue = document.getElementById("tetra").value;
    const pronounCase = document.getElementById("pronouns").checked ? 'H' : 'h'; // If checked, first letter of he, him, his is capital

    // Update tetragrammaton
    output.querySelectorAll('.yhwh').forEach(el => {
        el.textContent = tetraValue;
    });

    // Update pronouns
    output.querySelectorAll('.pro').forEach(el => {
        el.textContent = pronounCase + el.textContent.slice(1);
    });

    // Update image
    img.src = latinaCheckbox.checked
        ? "images/vibe.png"
        : "images/temp.jpg";
    img.onload = () => {
        img.classList.remove('hidden');
    }
}
