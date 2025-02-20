document.addEventListener("DOMContentLoaded", () => {
    // ----------------------------------------------------------------------
    // --- DOM Elements ---
    // ----------------------------------------------------------------------

    const themeSwitch = document.getElementById("theme-switch");
    const menuButtons = document.querySelectorAll(".menu-btn");
    const tasksView = document.getElementById("tasks-view");
    const addTaskView = document.getElementById("add-task-view");
    const statisticsView = document.getElementById("statistics-view");
    const searchInput = document.getElementById("search-input");
    const priorityFilter = document.getElementById("priority-filter");
    const categoryFilter = document.getElementById("category-filter");
    const taskForm = document.getElementById("task-form");
    const taskTitleInput = document.getElementById("task-title");
    const taskDescriptionInput = document.getElementById("task-description");
    const taskCategorySelect = document.getElementById("task-category");
    const taskPrioritySelect = document.getElementById("task-priority");
    const taskDueDateInput = document.getElementById("task-due-date");
    const taskDueTimeInput = document.getElementById("task-due-time");
    const tasksList = document.getElementById("tasks");
    const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");

    // ----------------------------------------------------------------------
    // --- Variables ---
    // ----------------------------------------------------------------------

    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    let categories = ["Work", "Personal", "Shopping", "Others"];
    let currentView = "tasks"; // Tracks the currently active view

    // Define Task Statuses
    const TaskStatus = {
        PENDING: "pending",
        IN_PROGRESS: "in-progress",
        COMPLETED: "completed",
        OVERDUE: "overdue",
    };

    // ----------------------------------------------------------------------
    // --- Theme Initialization and Handling ---
    // ----------------------------------------------------------------------

    const initializeTheme = () => {
        const savedTheme = localStorage.getItem("theme");
        const systemTheme = prefersDarkScheme.matches ? "dark" : "light";
        const initialTheme = savedTheme || systemTheme;

        document.documentElement.setAttribute("data-theme", initialTheme);
        updateThemeIcon(initialTheme);
    };

    const updateThemeIcon = (theme) => {
        const icon = themeSwitch.querySelector("i");
        if (theme === "dark") {
            icon.classList.remove("fa-moon");
            icon.classList.add("fa-sun");
            themeSwitch.setAttribute("title", "Switch to light mode");
        } else {
            icon.classList.remove("fa-sun");
            icon.classList.add("fa-moon");
            themeSwitch.setAttribute("title", "Switch to dark mode");
        }
    };

    themeSwitch.addEventListener("click", () => {
        const currentTheme = document.documentElement.getAttribute("data-theme");
        const newTheme = currentTheme === "dark" ? "light" : "dark";

        document.documentElement.classList.add("theme-transition");
        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("theme", newTheme);
        updateThemeIcon(newTheme);

        setTimeout(() => {
            document.documentElement.classList.remove("theme-transition");
        }, 300);
    });

    // ----------------------------------------------------------------------
    // --- Task Count Functions ---
    // ----------------------------------------------------------------------

    const updateTaskCount = () => {
        const count = tasks.length;
        const badge = document.getElementById("taskCount");

        if (badge) {
            badge.textContent = count;
            badge.classList.remove("high", "medium", "low");

            if (count > 10) {
                badge.classList.add("high");
            } else if (count > 5) {
                badge.classList.add("medium");
            } else {
                badge.classList.add("low");
            }

            badge.style.animation = "none";
            badge.offsetHeight; // Trigger reflow
            badge.style.animation = "badge-pop 0.3s ease";
            badge.style.display = count === 0 ? "none" : "flex";
        }
    };

    const saveTasksToLocalStorage = () => {
        localStorage.setItem("tasks", JSON.stringify(tasks));
    };

    // ----------------------------------------------------------------------
    // --- View Switching Functions ---
    // ----------------------------------------------------------------------

    const switchView = (viewId) => {
        tasksView.classList.add("hidden");
        addTaskView.classList.add("hidden");
        statisticsView.classList.add("hidden"); // Hide statistics view
        menuButtons.forEach((button) => button.classList.remove("active"));

        switch (viewId) {
            case "tasks":
                tasksView.classList.remove("hidden");
                document
                    .querySelector('.menu-btn[data-view="tasks"]')
                    .classList.add("active");
                currentView = "tasks";
                break;
            case "add":
                addTaskView.classList.remove("hidden");
                document
                    .querySelector('.menu-btn[data-view="add"]')
                    .classList.add("active");
                currentView = "add";
                break;
            case "statistics":
                statisticsView.classList.remove("hidden"); // Show statistics view
                document
                    .querySelector('.menu-btn[data-view="statistics"]')
                    .classList.add("active");
                currentView = "statistics";
                updateStatistics(); // Render statistics when view is switched
                break;
            default:
                console.warn(`Unknown view ID: ${viewId}`);
        }

        renderTasks(); // Re-render tasks after switching view
    };

    menuButtons.forEach((button) => {
        button.addEventListener("click", () => {
            menuButtons.forEach((button) => button.classList.remove("active"));
            button.classList.add("active");
            const viewId = button.dataset.view;
            switchView(viewId);
        });
    });

    // ----------------------------------------------------------------------
    // --- Task Rendering Functions ---
    // ----------------------------------------------------------------------

    const renderTasks = () => {
        tasksList.innerHTML = "";
        let filteredTasks = [...tasks];

        // Apply Filters
        const searchTerm = searchInput.value.toLowerCase();
        const priorityValue = priorityFilter.value;
        const categoryValue = categoryFilter.value;

        if (searchTerm) {
            filteredTasks = filteredTasks.filter((task) =>
                task.title.toLowerCase().includes(searchTerm)
            );
        }
        if (priorityValue !== "all") {
            filteredTasks = filteredTasks.filter(
                (task) => task.priority === priorityValue
            );
        }
        if (categoryValue !== "all") {
            filteredTasks = filteredTasks.filter(
                (task) => task.category === categoryValue
            );
        }

        // Handle Empty State
        if (filteredTasks.length === 0) {
            tasksList.innerHTML =
                '<div class="empty-state">' +
                '<div class="empty-state-container">' +
                '<div class="empty-state-icon">' +
                '<svg width="96" height="96" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                '<path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
                '<path d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5C15 6.10457 14.1046 7 13 7H11C9.89543 7 9 6.10457 9 5Z" stroke="currentColor" stroke-width="2"/>' +
                '<path d="M9 12H15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
                '<path d="M9 16H13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
                "</svg>" +
                "</div>" +
                '<h3 class="empty-state-title">No Tasks Found</h3>' +
                '<p class="empty-state-description">There are no tasks matching your criteria. Try adjusting your filters or create a new task.</p>' +
                '<button class="empty-state-button" id="addNewTaskBtn">' +
                '<i class="fas fa-plus"></i>' +
                "Add New Task" +
                "</button>" +
                "</div>" +
                "</div>";

            // Add event listener after creating the button
            const addNewTaskBtn = document.getElementById("addNewTaskBtn");
            if (addNewTaskBtn) {
                addNewTaskBtn.addEventListener("click", () => {
                    switchView("add");
                });
            }
            return;
        }

        filteredTasks.forEach((task, index) => {
            const taskElement = createTaskElement(task);
            tasksList.appendChild(taskElement);
        });
    };

    const createTaskElement = (task) => {
        const taskElement = document.createElement("div");
        taskElement.classList.add("task-card");

        const currentStatus = updateTaskStatus(task);
        taskElement.dataset.status = currentStatus;

        // Task Header
        const taskHeader = document.createElement("div");
        taskHeader.classList.add("task-header");

        // Title and Category
        const titleContainer = document.createElement("div");
        titleContainer.classList.add("title-container");

        const titleElement = document.createElement("h3");
        titleElement.classList.add("task-title");
        titleElement.textContent = task.title;

        const categoryElement = document.createElement("span");
        categoryElement.classList.add("category-tag", task.category.toLowerCase());
        categoryElement.textContent = task.category;

        titleContainer.appendChild(titleElement);
        titleContainer.appendChild(categoryElement);

        // Task Status with new status indicators
        const statusElement = document.createElement("div");
        statusElement.classList.add("task-status");
        statusElement.innerHTML = getStatusHTML(currentStatus);

        // Status Change Button
        const statusChangeBtn = document.createElement("button");
        statusChangeBtn.classList.add("status-change-btn");
        statusChangeBtn.innerHTML = '<i class="fas fa-ellipsis-v"></i>';
        statusChangeBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            showStatusChangeMenu(task, statusChangeBtn);
        });

        statusElement.appendChild(statusChangeBtn);
        taskHeader.appendChild(titleContainer);
        taskHeader.appendChild(statusElement);
        taskElement.appendChild(taskHeader);

        // Task Content
        if (task.description) {
            const descriptionElement = document.createElement("p");
            descriptionElement.classList.add("task-description");
            descriptionElement.textContent = task.description;
            taskElement.appendChild(descriptionElement);
        }

        // Task Meta Information
        const taskMeta = document.createElement("div");
        taskMeta.classList.add("task-meta");

        if (task.dueDate || task.dueTime) {
            const timeContainer = document.createElement("div");
            timeContainer.classList.add("time-info");

            if (task.dueDate) {
                const dueDateElement = document.createElement("span");
                dueDateElement.classList.add("due-date");
                dueDateElement.innerHTML = `<i class="far fa-calendar"></i> ${new Date(
                    task.dueDate
                ).toLocaleDateString()}`;
                timeContainer.appendChild(dueDateElement);
            }

            if (task.dueTime) {
                const dueTimeElement = document.createElement("span");
                dueTimeElement.classList.add("due-time");
                dueTimeElement.innerHTML = `<i class="far fa-clock"></i> ${task.dueTime}`;
                timeContainer.appendChild(dueTimeElement);
            }

            taskMeta.appendChild(timeContainer);
        }
        taskElement.appendChild(taskMeta);

        // Task Actions
        const taskActions = document.createElement("div");
        taskActions.classList.add("task-actions");

        const completeBtn = createButton(
            "complete-btn",
            task.completed ? "↩️ Undo" : "✓ Complete",
            () => toggleTaskStatus(task.id)
        );
        const editBtn = createButton("edit-btn", "✏️ Edit", () =>
            editTask(task.id)
        );
        const deleteBtn = createButton("delete-btn", "🗑️ Delete", () =>
            deleteTask(task.id)
        );

        taskActions.appendChild(completeBtn);
        taskActions.appendChild(editBtn);
        taskActions.appendChild(deleteBtn);
        taskElement.appendChild(taskActions);

        return taskElement;
    };

    const createButton = (className, text, onClick) => {
        const button = document.createElement("button");
        button.classList.add("task-btn", className);
        button.textContent = text;
        button.addEventListener("click", onClick);
        return button;
    };

    const getStatusHTML = (status) => {
        switch (status) {
            case TaskStatus.COMPLETED:
                return '<span class="status completed"><i class="fas fa-check-circle"></i> Completed</span>';
            case TaskStatus.IN_PROGRESS:
                return '<span class="status in-progress"><i class="fas fa-spinner fa-spin"></i> In Progress</span>';
            case TaskStatus.OVERDUE:
                return '<span class="status overdue"><i class="fas fa-exclamation-circle"></i> Overdue</span>';
            default:
                return '<span class="status pending"><i class="fas fa-clock"></i> Pending</span>';
        }
    };

    // ----------------------------------------------------------------------
    // --- Task Management Functions ---
    // ----------------------------------------------------------------------

    const addTask = (
        title,
        description,
        category,
        priority,
        dueDate,
        dueTime
    ) => {
        const newTask = {
            id: Date.now(),
            title,
            description,
            category,
            priority,
            dueDate,
            dueTime,
            completed: false,
        };
        tasks.push(newTask);

        saveTasksToLocalStorage();
        updateTaskCount();
        onTasksChanged();
        if (currentView === "tasks") {
            renderTasks();
        }
    };

    const toggleTaskStatus = (taskId) => {
        const taskIndex = tasks.findIndex((task) => task.id === taskId);
        if (taskIndex !== -1) {
            tasks[taskIndex].completed = !tasks[taskIndex].completed;
            saveTasksToLocalStorage();
            onTasksChanged();
            renderTasks();
        }
    };

    const editTask = (taskId) => {
        const taskIndex = tasks.findIndex((task) => task.id === taskId);
        if (taskIndex !== -1) {
            const task = tasks[taskIndex];
            switchView("add");

            taskTitleInput.value = task.title;
            taskDescriptionInput.value = task.description;
            taskCategorySelect.value = task.category.toLowerCase();
            taskPrioritySelect.value = task.priority;
            taskDueDateInput.value = task.dueDate;
            taskDueTimeInput.value = task.dueTime;

            tasks.splice(taskIndex, 1);

            saveTasksToLocalStorage();
            updateTaskCount();
            onTasksChanged();
            renderTasks();
        }
    };

    const deleteTask = (taskId) => {
        const taskIndex = tasks.findIndex((task) => task.id === taskId);
        if (taskIndex !== -1) {
            tasks.splice(taskIndex, 1);

            saveTasksToLocalStorage();
            updateTaskCount();
            onTasksChanged();
            renderTasks();
        }
    };

    const updateTaskStatus = (task) => {
        if (task.completed) {
            return TaskStatus.COMPLETED;
        }

        const now = new Date();
        const dueDate = task.dueDate ? new Date(task.dueDate) : null;
        const dueTime = task.dueTime
            ? new Date(`${task.dueDate}T${task.dueTime}`)
            : null;

        if (dueDate && dueDate < now && !task.completed && dueTime < now) {
            return TaskStatus.OVERDUE;
        }

        if (task.startedAt && !task.completed) {
            return TaskStatus.IN_PROGRESS;
        }
        onTasksChanged();
        return TaskStatus.PENDING;
    };

    const showStatusChangeMenu = (task, buttonElement) => {
        const menu = document.createElement("div");
        menu.className = "status-menu";
        menu.innerHTML = `
            <div class="status-menu-item" data-status="${TaskStatus.PENDING}">
                <i class="fas fa-clock"></i> Set as Pending
            </div>
            <div class="status-menu-item" data-status="${TaskStatus.IN_PROGRESS}">
                <i class="fas fa-spinner"></i> Start Task
            </div>
            <div class="status-menu-item" data-status="${TaskStatus.COMPLETED}">
                <i class="fas fa-check-circle"></i> Mark Complete
            </div> `;

        const rect = buttonElement.getBoundingClientRect();
        menu.style.position = "absolute";
        menu.style.top = `${rect.bottom + window.scrollY}px`;
        menu.style.left = `${rect.left + window.scrollX}px`;

        menu.addEventListener("click", (e) => {
            const item = e.target.closest(".status-menu-item");
            if (item) {
                const newStatus = item.dataset.status;
                changeTaskStatus(task, newStatus);
                menu.remove();
            }
        });

        document.addEventListener("click", function closeMenu(e) {
            if (!menu.contains(e.target) && e.target !== buttonElement) {
                menu.remove();
                document.removeEventListener("click", closeMenu);
            }
        });

        document.body.appendChild(menu);
    };

    const changeTaskStatus = (task, newStatus) => {
        task.status = newStatus;

        if (newStatus === TaskStatus.IN_PROGRESS) {
            task.startedAt = new Date().toISOString();
        } else if (newStatus === TaskStatus.COMPLETED) {
            task.completed = true;
            task.completedAt = new Date().toISOString();
        }

        onTasksChanged();
        saveTasksToLocalStorage();
        renderTasks();
    };

    // ----------------------------------------------------------------------
    // --- Form Handling ---
    // ----------------------------------------------------------------------

    taskForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const title = taskTitleInput.value.trim();
        const description = taskDescriptionInput.value.trim();
        const category = taskCategorySelect.value;
        const priority = taskPrioritySelect.value;
        const dueDate = taskDueDateInput.value;
        const dueTime = taskDueTimeInput.value;

        if (!title || !category || !priority || !dueDate || !dueTime) {
            alert("Please fill in all required fields.");
            return;
        }

        addTask(title, description, category, priority, dueDate, dueTime);

        // Reset the form
        taskForm.reset();

        switchView("tasks");
    });

    // ----------------------------------------------------------------------
    // --- Category Handling ---
    // ----------------------------------------------------------------------

    const populateCategoryFilter = () => {
        categoryFilter.innerHTML = '<option value="all">All Categories</option>';
        categories.forEach((category) => {
            const option = document.createElement("option");
            option.value = category.toLowerCase();
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
    };

    const populateCategorySelect = () => {
        taskCategorySelect.innerHTML = '<option value="">Select Category</option>';
        categories.forEach((category) => {
            const option = document.createElement("option");
            option.value = category.toLowerCase();
            option.textContent = category;
            taskCategorySelect.appendChild(option);
        });
    };

    // ----------------------------------------------------------------------
    // --- Event Listeners for Filtering ---
    // ----------------------------------------------------------------------

    searchInput.addEventListener("input", renderTasks);
    priorityFilter.addEventListener("change", renderTasks);
    categoryFilter.addEventListener("change", renderTasks);

    // ----------------------------------------------------------------------
    // --- Statistics Rendering ---
    // ----------------------------------------------------------------------

    // Statistics Update Functions
    const updateStatistics = () => {
        const stats = calculateStatistics();
        updateStatCards(stats);
        updatePriorityChart(stats);
        updateCategoryDistribution(stats);
    };

    const calculateStatistics = () => {
        const now = new Date();
        const stats = {
            total: tasks.length,
            completed: 0,
            pending: 0,
            overdue: 0,
            dueSoon: 0,
            critical: 0,
            priority: { high: 0, medium: 0, low: 0 },
            categories: {},
            activeProjects: new Set(tasks.map((task) => task.category)).size,
            completionRate: 0,
            timeline: {},
        };

        // Calculate all statistics
        tasks.forEach((task) => {
            // Status counts
            if (task.status === "completed") {
                stats.completed++;
                if (task.completedAt) {
                    const completionDate = new Date(task.completedAt)
                        .toISOString()
                        .split("T")[0];
                    stats.timeline[completionDate] =
                        (stats.timeline[completionDate] || 0) + 1;
                }
            } else {
                stats.pending++;

                // Check due dates
                const dueDate = new Date(task.dueDate);
                if (task.dueTime) {
                    const [hours, minutes] = task.dueTime.split(":");
                    dueDate.setHours(parseInt(hours), parseInt(minutes));
                }

                const diffHours = (dueDate - now) / (1000 * 60 * 60);

                if (dueDate < now) {
                    stats.overdue++;
                    if (task.priority === "high") {
                        stats.critical++;
                    }
                } else if (diffHours <= 24) {
                    stats.dueSoon++;
                }
            }

            // Priority counts
            stats.priority[task.priority]++;

            // Category counts
            stats.categories[task.category] =
                (stats.categories[task.category] || 0) + 1;
        });

        // Calculate completion rate
        stats.completionRate =
            stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

        // Update DOM elements with statistics
        updateStatCards(stats);

        return stats; // Return stats object in case it's needed elsewhere
    };

    const updateStatCards = (stats) => {
        // Update main stat cards
        document.getElementById("total-tasks-count").textContent = stats.total;
        document.getElementById("completed-tasks-count").textContent =
            stats.completed;
        document.getElementById("pending-tasks-count").textContent =
            stats.pending;
        document.getElementById("overdue-tasks-count").textContent =
            stats.overdue;

        // Update additional stats
        document.getElementById("active-projects").textContent =
            stats.activeProjects;
        document.getElementById("due-soon-count").textContent = stats.dueSoon;
        document.getElementById("critical-count").textContent = stats.critical;

        // Update completion rate
        const completionProgress = document.getElementById("completion-progress");
        if (completionProgress) {
            completionProgress.style.width = `${stats.completionRate}%`;
        }
        const completionRate = document.getElementById("completion-rate");
        if (completionRate) {
            completionRate.textContent = `${stats.completionRate}%`;
        }
    };

    const updatePriorityChart = (stats) => {
        const maxPriority = Math.max(...Object.values(stats.priority));

        Object.entries(stats.priority).forEach(([priority, count]) => {
            const percentage = maxPriority > 0 ? (count / maxPriority) * 100 : 0;
            const bar = document.getElementById(`${priority}-priority-bar`);
            const countElement = document.getElementById(
                `${priority}-priority-count`
            );

            bar.style.width = `${percentage}%`;
            countElement.textContent = count;
        });
    };

    const updateCategoryDistribution = (stats) => {
        const categoryStats = document.getElementById("category-stats");
        categoryStats.innerHTML = "";

        Object.entries(stats.categories).forEach(([category, count]) => {
            const pill = document.createElement("div");
            pill.classList.add("category-pill", category);
            pill.innerHTML = `
            <span>${category}</span>
            <span class="count">${count}</span>
        `;
            categoryStats.appendChild(pill);
        });
    };

    // Event Listeners for Date Filter
    document.querySelectorAll(".date-filter-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            document
                .querySelector(".date-filter-btn.active")
                .classList.remove("active");
            btn.classList.add("active");
            updateStatistics(); // Update with new date range
        });
    });

    // Initialize Charts using ApexCharts
    const initializeCharts = () => {
        // Category Distribution Chart
        const categoryOptions = {
            chart: {
                type: "donut",
                height: 300,
                fontFamily: "inherit",
                background: "transparent",
                animations: {
                    enabled: true,
                    easing: "easeinout",
                    speed: 800,
                    animateGradually: {
                        enabled: true,
                        delay: 150,
                    },
                },
            },
            colors: ["#e11d48", "#0891b2", "#ca8a04", "#7c3aed"],
            legend: {
                position: "bottom",
                horizontalAlign: "center",
                fontSize: "14px",
                markers: {
                    radius: 12,
                },
            },
            plotOptions: {
                pie: {
                    donut: {
                        size: "70%",
                    },
                },
            },
            dataLabels: {
                enabled: true,
                formatter: function (val) {
                    return Math.round(val) + "%";
                },
            },
            series: [],
            labels: [],
        };

        const categoryChart = new ApexCharts(
            document.querySelector("#categoryChart"),
            categoryOptions
        );
        categoryChart.render();

        // Timeline Chart
        const timelineOptions = {
            chart: {
                type: "area",
                height: 300,
                fontFamily: "inherit",
                background: "transparent",
                toolbar: {
                    show: false,
                },
                animations: {
                    enabled: true,
                    easing: "easeinout",
                    speed: 800,
                },
            },
            colors: ["#2563eb"],
            stroke: {
                curve: "smooth",
                width: 3,
            },
            fill: {
                type: "gradient",
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.7,
                    opacityTo: 0.3,
                },
            },
            dataLabels: {
                enabled: false,
            },
            xaxis: {
                type: "datetime",
                labels: {
                    style: {
                        colors: "#64748b",
                    },
                    format: "dd MMM",
                },
            },
            yaxis: {
                labels: {
                    style: {
                        colors: "#64748b",
                    },
                },
            },
            grid: {
                borderColor: "#e2e8f0",
                strokeDashArray: 4,
            },
            series: [
                {
                    name: "Completed Tasks",
                    data: [],
                },
            ],
        };

        const timelineChart = new ApexCharts(
            document.querySelector("#timelineChart"),
            timelineOptions
        );
        timelineChart.render();

        return { categoryChart, timelineChart };
    };

    // Calculate Statistics based on actual tasks data
    const calculateChartData = (timeRange = "week") => {
        const now = new Date();
        const stats = {
            categories: {},
            timeline: {},
        };

        // Initialize categories from tasks
        tasks.forEach((task) => {
            if (!stats.categories[task.category]) {
                stats.categories[task.category] = 0;
            }
            stats.categories[task.category]++;
        });

        // Calculate date range for timeline
        let startDate = new Date();
        switch (timeRange) {
            case "week":
                startDate.setDate(now.getDate() - 7);
                break;
            case "month":
                startDate.setMonth(now.getMonth() - 1);
                break;
            case "year":
                startDate.setFullYear(now.getFullYear() - 1);
                break;
        }

        // Initialize timeline dates
        let currentDate = new Date(startDate);
        while (currentDate <= now) {
            const dateStr = currentDate.toISOString().split("T")[0];
            stats.timeline[dateStr] = 0;
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Fill timeline data from completed tasks
        tasks.forEach((task) => {
            if (task.completed) {
                const completionDate = new Date(task.completedAt || task.dueDate);
                if (completionDate >= startDate && completionDate <= now) {
                    const dateStr = completionDate.toISOString().split("T")[0];
                    if (stats.timeline[dateStr] !== undefined) {
                        stats.timeline[dateStr]++;
                    }
                }
            }
        });

        return stats;
    };

    // Update Charts with actual data
    const updateCharts = (timeRange = "week") => {
        const stats = calculateChartData(timeRange);
        const { categoryChart, timelineChart } = window.charts;

        // Update Category Distribution
        const categoryData = Object.entries(stats.categories);
        categoryChart.updateOptions({
            series: categoryData.map(([_, count]) => count),
            labels: categoryData.map(
                ([category, _]) => category.charAt(0).toUpperCase() + category.slice(1)
            ),
        });

        // Update Timeline
        const timelineData = Object.entries(stats.timeline)
            .map(([date, count]) => ({
                x: new Date(date).getTime(),
                y: count,
            }))
            .sort((a, b) => a.x - b.x);

        timelineChart.updateSeries([
            {
                name: "Completed Tasks",
                data: timelineData,
            },
        ]);
    };

    // Event Listeners for timeline filter
    document.querySelectorAll(".timeline-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            document.querySelector(".timeline-btn.active").classList.remove("active");
            btn.classList.add("active");
            updateCharts(btn.dataset.range);
        });
    });

    // Initialize charts and update them whenever tasks change
    const initializeStatistics = () => {
        window.charts = initializeCharts();
        updateCharts("week");
    };

    // Call this function whenever tasks are modified
    const onTasksChanged = () => {
        updateCharts(document.querySelector(".timeline-btn.active").dataset.range);
    };




    // ----------------------------------------------------------------------
    // --- Initialization  Statistics---
    // ----------------------------------------------------------------------

    initializeStatistics();

    // ----------------------------------------------------------------------
    // --- Initialization ---
    // ----------------------------------------------------------------------

    initializeTheme();
    updateTaskCount();
    populateCategorySelect();
    populateCategoryFilter();
    switchView(currentView); // Show initial view, then renderTasks from switchView
});
