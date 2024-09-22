const express = require("express");
const path = require("path");
const bcrypt = require('bcryptjs');
const multer = require('multer');
const session = require('express-session');
const { createClient } = require("@supabase/supabase-js");
const hbs = require("hbs");
const cloudinary = require('cloudinary').v2;
const app = express();
const PORT = process.env.PORT || 5000;
const SUPABASE_URL = "https://hzfiosbwnhkohwasfmxp.supabase.co";
const SUPABASE_SERVICE_ROLE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6Zmlvc2J3bmhrb2h3YXNmbXhwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNjk2MjM1MiwiZXhwIjoyMDQyNTM4MzUyfQ.ucQkz54Qa3cs7eXlwEzRQBr-q-hSz-UH8eLzN7uVEZI"; 
const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
const saltRounds = 10;

cloudinary.config({
    cloud_name: 'dcxwl1qat',
    api_key: '912763541539931', // Ganti dengan API key Anda
    api_secret: 'gicrvStURE3DGzWoM7HW1GM51f8', // Ganti dengan API secret Anda
});

hbs.registerHelper('formatDate', function(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(date).toLocaleDateString('id-ID', options); // Ganti 'id-ID' dengan kode lokal yang sesuai jika perlu
});
// Set up view engine and static files
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "./views"));
app.use("/assets", express.static(path.join(__dirname, "./assets")));
app.use(express.urlencoded({ extended: true }));

// Initialize multer to handle file uploads
const storage = multer.memoryStorage(); // Use memory storage for uploads
const upload = multer({ storage: storage });

// Session management
app.use(session({
    secret: 'ikram',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

// Routes
app.get("/", home);
app.get("/contact", contact);
app.get("/testimonial", testimonial);
app.get("/addproject", project);
app.get("/project", projectShow);
app.get("/delete-project/:id", projectDelete);
app.get("/edit-project/:id", projectEditView);
app.post("/edit-project/:id", upload.single('image'), projectEdit);
app.get("/detail-project/:id", projectDetail);
app.post("/project", upload.single('image'), postProject);
app.get("/login", loginView);
app.get("/register", registerView);
app.post("/register", register);
app.post("/login", login);
app.get("/logout", logout);

// Register user with Supabase
async function register(req, res) {
    const { name, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const { data, error } = await db
            .from('users')
            .insert([{ name, email, password: hashedPassword }]);

        if (error) {
            throw error;
        }
        res.redirect('/login');
    } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).send("Error registering user");
    }
}

// Login user
async function login(req, res) {
    const { email, password } = req.body;
    try {
        const { data: users, error } = await db
            .from('users')
            .select('*')
            .eq('email', email)
            .limit(1);

        if (error || users.length === 0) {
            req.session.errorMessage = 'User not found';
            return res.redirect('/login');
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            req.session.errorMessage = 'Incorrect password';
            return res.redirect('/login');
        }

        req.session.user = { id: user.id, email: user.email, name: user.name };
        req.session.successMessage = 'Login successful!';
        res.redirect('/');
    } catch (error) {
        console.error("Error logging in user:", error);
        req.session.errorMessage = 'Error logging in user';
        res.redirect('/login');
    }
}

// Logout user
function logout(req, res) {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/');
        }
        res.redirect('/login');
    });
}

// Show projects
async function projectShow(req, res) {
    try {
        const { data: projects, error } = await db
            .from('project')
            .select('*, users (name)');

        if (error) {
            throw error;
        }

        const user = req.session.user;
        const successMessage = req.session.successMessage || null;
        req.session.successMessage = null;

        res.render("project", { projects, user, successMessage });
    } catch (error) {
        console.error("Error fetching projects:", error);
        res.status(500).send("Error fetching projects");
    }
}

// Project details
async function projectDetail(req, res) {
    const { id } = req.params;
    try {
        const { data: project, error } = await db
            .from('project')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !project) {
            return res.status(404).send("Project not found");
        }

        const user = req.session.user;
        res.render("detailProject", { project, user });
    } catch (error) {
        console.error("Error fetching project details:", error);
        res.status(500).send("Error fetching project details");
    }
}

// Delete project
async function projectDelete(req, res) {
    const { id } = req.params;
    try {
        const { error } = await db
            .from('project')
            .delete()
            .eq('id', id);

        if (error) {
            throw error;
        }

        req.session.successMessage = "Project deleted successfully!";
        res.redirect("/project");
    } catch (error) {
        console.error("Error deleting project:", error);
        res.status(500).send("Error deleting project");
    }
}

// Edit project view
async function projectEditView(req, res) {
    const { id } = req.params;
    try {
        const { data: project, error } = await db
            .from('project')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !project) {
            return res.status(404).send("Project not found");
        }

        res.render("editproject", { project });
    } catch (error) {
        console.error("Error fetching project for edit view:", error);
        res.status(500).send("Error fetching project for edit view");
    }
}

// Edit project submission with file upload
async function projectEdit(req, res) {
    const { id } = req.params;
    const { project_name, description, start_date, end_date, technologies = [] } = req.body;

    try {
        const image = req.file ? await uploadFileToCloudinary(req.file) : req.body.existingImage;

        const { error } = await db
            .from('project')
            .update({
                project_name,
                description,
                start_date: new Date(start_date),
                end_date: new Date(end_date),
                technologies,
                image
            })
            .eq('id', id);

        if (error) {
            throw error;
        }

        req.session.successMessage = "Project updated successfully!";
        res.redirect("/project");
    } catch (error) {
        console.error("Error updating project:", error);
        res.status(500).send("Error updating project");
    }
}

// Upload file to Cloudinary
async function uploadFileToCloudinary(file) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { resource_type: 'auto' },
            (error, result) => {
                if (error) {
                    return reject(new Error("Cloudinary upload failed: " + error.message));
                }
                resolve(result.secure_url);
            }
        );
        stream.end(file.buffer); // Menggunakan buffer untuk upload
    });
}

// Add project with file upload
async function postProject(req, res) {
    const { project_name, start_date, end_date, description, technologies = [] } = req.body;
    const userId = req.session.user.id;

    try {
        const imageUrl = req.file ? await uploadFileToCloudinary(req.file) : 'https://default.image.url'; // Ganti dengan URL gambar default

        const { error } = await db
            .from('project')
            .insert({
                project_name,
                start_date: new Date(start_date),
                end_date: new Date(end_date),
                description,
                technologies,
                image: imageUrl,
                userid: userId,
            });

        if (error) {
            throw error;
        }

        req.session.successMessage = "Project added successfully!";
        res.redirect("/project");
    } catch (error) {
        console.error("Error adding project:", error);
        res.status(500).send("Error adding project");
    }
}

// Contact page
function contact(req, res) {
    const user = req.session.user;
    res.render("contact", { user });
}

// Home page
function home(req, res) {
    const user = req.session.user;
    const errorMessage = req.session.errorMessage || null;
    req.session.errorMessage = null;

    res.render("index", { user, errorMessage });
}

// Testimonial page
function testimonial(req, res) {
    const user = req.session.user;
    res.render("testimonial", { user });
}

// Project page
function project(req, res) {
    const user = req.session.user;
    res.render("addproject", { user });
}

// Login view
function loginView(req, res) {
    const errorMessage = req.session.errorMessage || null;
    req.session.errorMessage = null;
    res.render("login", { errorMessage });
}

// Register view
function registerView(req, res) {
    res.render("register");
}

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
