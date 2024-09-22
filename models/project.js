const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Adjust path as needed

const Project = sequelize.define('Project', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    project_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT
    },
    start_date: {
        type: DataTypes.DATE
    },
    end_date: {
        type: DataTypes.DATE
    },
    technologies: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: []
    },
    image: {
        type: DataTypes.STRING
    },

    userId:{
      type : DataTypes.INTEGER,
      references:{
        model:"User",
        key:"id"
      }
    },
   
}, {
    tableName: 'project',
    timestamps: true, // Enable timestamps if your table has createdAt and updatedAt columns
});

module.exports = Project;
