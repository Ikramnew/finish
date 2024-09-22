const express = require("express");
const path = require("path");
const config = require("./config/config.json");
const { Sequelize, QueryTypes } = require("sequelize");
const bcrypt = require('bcryptjs');
const Project = require('./models/project');
const User = require('./models/user');
const saltRounds = 10;
const app = express();
const port = 3000;
const session = require('express-session');
const multer = require('multer');
// Initialize Sequelize
const sequelize = new Sequelize(config.development);
// Configure multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, 'uploads')); // Directory where files will be stored
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const hbs = require('hbs');

// Register the helper for formatting dates
hbs.registerHelper('formatDate', function(date) {
  const formattedDate = new Date(date).toISOString().split('T')[0]; // Format as 'YYYY-MM-DD'
  return formattedDate;
});

// Initialize multer with the configured storage
const upload = multer({ storage: storage });

// Set up view engine and static files
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "./views"));
app.use("/assets", express.static(path.join(__dirname, "./assets")));
app.use('/uploads', express.static(path.join(__dirname, './uploads')));
app.use(express.urlencoded({ extended: true }));

// Session management
app.use(session({
    secret: 'ikram', 
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

// Middleware to log session data
app.use((req, res, next) => {
    console.log('Session Data:', req.session);
    next(); // Proceed to the next middleware or route handler
});

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

// Register user
async function register(req, res) {
    const { name, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        await sequelize.query(
            'INSERT INTO users (name, email, password) VALUES (:name, :email, :password)',
            {
                replacements: { name, email, password: hashedPassword },
                type: QueryTypes.INSERT
            }
        );
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
        const [user] = await sequelize.query(
            'SELECT * FROM users WHERE email = :email',
            {
                replacements: { email },
                type: QueryTypes.SELECT
            }
        );

        if (!user) {
            req.session.errorMessage = 'User not found';
            return res.redirect('/login');
        }

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
        const query = `
            SELECT public.project.*, public.users.name AS author 
            FROM public.project 
            INNER JOIN public.users ON public.project."userId" = public.users.id;
        `;
        const result = await sequelize.query(query, { type: QueryTypes.SELECT });

        const user = req.session.user;
        const successMessage = req.session.successMessage || null;

        req.session.successMessage = null;  // Clear the success message after showing it

        res.render("project", { projects: result, user, successMessage });
    } catch (error) {
        console.error("Error fetching projects:", error);
        res.status(500).send("Error fetching projects");
    }
}



// Project details
async function projectDetail(req, res) {
    const { id } = req.params;
    try {
        const user = req.session.user;
        const project = await Project.findByPk(id);
        if (!project) {
            return res.status(404).send("Project not found");
        }
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
        await Project.destroy({ where: { id } });
        req.session.successMessage = "Project deleted successfully!";  // Set success message
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
        const project = await Project.findByPk(id);
        if (!project) {
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
        const image = req.file ? `/uploads/${req.file.filename}` : req.body.existingImage;

        await Project.update({
            project_name,
            description,
            start_date: new Date(start_date),
            end_date: new Date(end_date),
            technologies,
            image
        }, {
            where: { id }
        });

        req.session.successMessage = "Project updated successfully!";  // Set success message
        res.redirect("/project");
    } catch (error) {
        console.error("Error updating project:", error);
        res.status(500).send("Error updating project");
    }
}

// Add project with file upload
async function postProject(req, res) {
    const { project_name, start_date, end_date, description, technologies = [] } = req.body;
    const defaultImage = 'https://wallpapers.com/images/hd/gojo-satoru-side-profile-3xdwa05tznpyotz9.jpg';
    
    const userId = req.session.user.id;

    try {
        const image = req.file ? `/uploads/${req.file.filename}` : defaultImage;

        await Project.create({
            project_name,
            start_date: new Date(start_date),
            end_date: new Date(end_date),
            description,
            technologies,
            image,
            userId
        });

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
    const successMessage = req.session.successMessage || null;

    req.session.errorMessage = null;
    req.session.successMessage = null;

    res.render("index", { user, errorMessage, successMessage });
}

// Testimonial page
function testimonial(req, res) {
    const user = req.session.user;
    res.render("testimonial", { user });
}

// Add project page
function project(req, res) {
    const user = req.session.user;
    res.render("addproject", { user });
}

// Login view
function loginView(req, res) {
    const errorMessage = req.session.errorMessage || null;
    const successMessage = req.session.successMessage || null;

    req.session.errorMessage = null;
    req.session.successMessage = null;

    res.render("login", { errorMessage, successMessage });
}

// Register view
function registerView(req, res) {
    res.render("register");
}

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
