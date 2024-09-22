
 // Pemetaan teknologi ke ikon Font Awesome
const techIconMap = {
    'Javascript': '<i class="fa-brands fa-js"></i>',
    'Node.js': '<i class="fa-brands fa-node-js"></i>',
    'React.js': '<i class="fa-brands fa-react"></i>',
    'HTML': '<i class="fa-brands fa-html5"></i>',
};

// Fungsi untuk mengganti nama teknologi dengan ikon dan menghitung durasi
function replaceTechnologiesAndCalculateDuration() {
    // Dapatkan semua elemen yang memiliki class 'tech-icons' dan 'start_date' serta 'end_date'
    const projectCards = document.querySelectorAll('.card-body');

    projectCards.forEach(card => {
        // Ubah teks teknologi menjadi ikon
        const techElement = card.querySelector('.tech-icons');
        if (techElement) {
            const techText = techElement.textContent;
            const techList = techText.split(',').map(tech => tech.trim());
            const iconsHtml = techList.map(tech => techIconMap[tech] || tech).join(' ');
            techElement.innerHTML = iconsHtml;
        }

        // Format tanggal dan hitung durasi
        const startDateElement = card.querySelector('.start-date');
        const endDateElement = card.querySelector('.end-date');
        const durationElement = card.querySelector('.duration');

        if (startDateElement && endDateElement && durationElement) {
            const startDate = new Date(startDateElement.textContent.trim());
            const endDate = new Date(endDateElement.textContent.trim());

            // Format the dates (remove time using toDateString)
            const formattedStartDate = startDate.toDateString();  // Removes time part
            const formattedEndDate = endDate.toDateString();

            // Display formatted dates
            startDateElement.textContent = formattedStartDate;
            endDateElement.textContent = formattedEndDate;

            // Calculate duration in days
            const durationInMilliseconds = endDate - startDate;
            const durationInDays = Math.floor(durationInMilliseconds / (1000 * 60 * 60 * 24)); // Milliseconds to days
            durationElement.textContent = `Duration: ${durationInDays} Days`;
        }
    });
}

// Panggil fungsi setelah konten dimuat
window.onload = replaceTechnologiesAndCalculateDuration;


