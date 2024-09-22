function getTestimonialData(url) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", url, true);

      xhr.onerror = () => {
        reject("Network Error!");
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(`Error: ${xhr.status}`);
        }
      };

      xhr.send();
    });
  }

  // Asynchronous function to get and display all testimonials
  async function allTestimonial() {
    try {
      const testimonials = await getTestimonialData("https://api.npoint.io/418e771b33eefaf45a42");

      const testimonialHTML = testimonials.map((testimonial) => {
        return `<div class="card shadow-lg mx-3" style="width: 300px;">
                  <img src="${testimonial.image}" class="card-img-top" alt="Testimonial Photo" style="height: 200px;">
                  <div class="card-body">
                    <p><i>~ ${testimonial.author}</i></p>
                    <p class="card-text">"${testimonial.content}"</p>
                    <div class="d-flex justify-content-center">
                      ${[...Array(5)].map((_, i) =>
                        i < testimonial.rating
                          ? '<i class="fas fa-star text-warning"></i>'
                          : '<i class="fas fa-star text-secondary"></i>').join('')}
                    </div>
                  </div>
                </div>`;
      });

      document.getElementById("testimonials").innerHTML = testimonialHTML.join("");
    } catch (error) {
      console.error("Failed to load testimonials:", error);
    }
  }

  // Asynchronous function to filter testimonials by rating
  async function filterTestimonial(rating) {
    try {
      const testimonials = await getTestimonialData("https://api.npoint.io/418e771b33eefaf45a42");

      const filteredTestimonials = testimonials.filter((testimonial) => {
        return testimonial.rating == rating;
      });

      const testimonialHTML = filteredTestimonials.map((testimonial) => {
        return `<div class="card shadow-lg mx-3" style="width: 300px;">
                  <img src="${testimonial.image}" class="card-img-top" alt="Testimonial Photo" style="height: 200px;">
                  <div class="card-body">
                    <p><i>~ ${testimonial.author}</i></p>
                    <p class="card-text">"${testimonial.content}"</p>
                    <div class="d-flex justify-content-center">
                      ${[...Array(5)].map((_, i) =>
                        i < testimonial.rating
                          ? '<i class="fas fa-star text-warning"></i>'
                          : '<i class="fas fa-star text-secondary"></i>').join('')}
                    </div>
                  </div>
                </div>`;
      });

      document.getElementById("testimonials").innerHTML = testimonialHTML.join("");
    } catch (error) {
      console.error("Failed to filter testimonials:", error);
    }
  }

  // Load all testimonials on page load
  window.onload = allTestimonial;