const fs = require('fs');
const path = require('path');
const colors = require('@colors/colors');

try {
  console.log('Starting setup...'.green);
  
  const calculatorHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Handyman Cost Calculator</title>
  <link href="https://fonts.googleapis.com/css2?family=SF+Pro+Display:wght@300;400;500&display=swap" rel="stylesheet">
  <style>
    /* Jony Ive inspired design */
    :root {
      --primary-color: #007AFF;
      --background-color: #FFFFFF;
      --text-color: #1D1D1F;
      --secondary-text: #86868B;
      --border-color: #E5E5E5;
      --highlight-color: #F5F5F7;
      --shadow-color: rgba(0, 0, 0, 0.05);
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--highlight-color);
      color: var(--text-color);
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      padding: 40px 20px;
      margin: 0;
    }
    
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: var(--background-color);
      border-radius: 18px;
      overflow: hidden;
      box-shadow: 0 10px 30px var(--shadow-color);
    }
    
    .header {
      padding: 30px;
      text-align: center;
      background: linear-gradient(to right, #F2F2F2, #FFFFFF);
    }
    
    h1 {
      font-weight: 300;
      font-size: 28px;
      letter-spacing: -0.5px;
      margin-bottom: 10px;
      color: var(--text-color);
    }
    
    .subtitle {
      font-weight: 400;
      font-size: 16px;
      color: var(--secondary-text);
    }
    
    .calculator-section {
      padding: 30px;
      border-bottom: 1px solid var(--border-color);
    }
    
    label {
      display: block;
      margin-bottom: 8px;
      font-size: 14px;
      font-weight: 500;
      color: var(--secondary-text);
    }
    
    select, input {
      width: 100%;
      padding: 14px;
      margin-bottom: 20px;
      border: 1px solid var(--border-color);
      border-radius: 10px;
      font-size: 16px;
      font-weight: 400;
      color: var(--text-color);
      background-color: var(--background-color);
      transition: all 0.2s ease;
      -webkit-appearance: none;
    }
    
    select {
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2386868B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 14px center;
      padding-right: 40px;
    }
    
    select:focus, input:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
    }
    
    button {
      width: 100%;
      padding: 14px;
      border: none;
      border-radius: 10px;
      font-size: 16px;
      font-weight: 500;
      color: white;
      background-color: var(--primary-color);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    button:hover {
      background-color: #0062CC;
    }
    
    button:active {
      transform: scale(0.98);
    }
    
    .icon {
      display: block;
      text-align: center;
      font-size: 36px;
      margin: 20px 0;
      color: var(--primary-color);
    }
    
    .estimate {
      background-color: var(--highlight-color);
      border-radius: 10px;
      padding: 20px;
      margin-top: 20px;
      font-size: 15px;
      line-height: 1.6;
      color: var(--text-color);
      min-height: 100px;
    }
    
    .add-btn {
      margin-top: 20px;
      background-color: #34C759;
    }
    
    .add-btn:hover {
      background-color: #2BB14F;
    }
    
    .running-total-section {
      padding: 30px;
    }
    
    .running-total-title {
      font-size: 20px;
      font-weight: 500;
      margin-bottom: 20px;
      color: var(--text-color);
      text-align: center;
    }
    
    .task-list {
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 2px 10px var(--shadow-color);
      margin-bottom: 20px;
    }
    
    .task-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    
    .task-table th {
      text-align: left;
      padding: 14px;
      background-color: var(--highlight-color);
      color: var(--secondary-text);
      font-weight: 500;
    }
    
    .task-table td {
      padding: 14px;
      border-top: 1px solid var(--border-color);
      color: var(--text-color);
    }
    
    .delete-btn {
      padding: 6px 12px;
      font-size: 12px;
      border-radius: 6px;
      background-color: #FF3B30;
      color: white;
      width: auto;
    }
    
    .delete-btn:hover {
      background-color: #D63030;
    }
    
    .total-section {
      background-color: var(--highlight-color);
      border-radius: 10px;
      padding: 20px;
      text-align: right;
      font-size: 18px;
      font-weight: 500;
      color: var(--text-color);
    }
    
    .price-highlight {
      color: var(--primary-color);
      font-weight: 500;
    }
    
    .range-separator {
      color: var(--secondary-text);
      margin: 0 4px;
    }
    
    @media (max-width: 600px) {
      body {
        padding: 20px 10px;
      }
      
      .container {
        border-radius: 12px;
      }
      
      .header {
        padding: 20px;
      }
      
      h1 {
        font-size: 24px;
      }
      
      .calculator-section, .running-total-section {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Handyman Cost Calculator</h1>
      <div class="subtitle">Estimate your project costs with precision</div>
    </div>
    
    <div class="calculator-section">
      <label for="task">Select Task</label>
      <select id="task">
        <!-- Options will be populated by JavaScript -->
      </select>
      
      <label for="quantity">Quantity</label>
      <input type="number" id="quantity" min="1" value="1">
      
      <button onclick="showEstimate()">Calculate Estimate</button>
      
      <div class="icon" id="icon">🛠️</div>
      
      <div class="estimate" id="estimateBox">
        Select a task to see pricing information.
      </div>
      
      <button class="add-btn" id="addBtn" style="display: none;" onclick="addToList()">Add to Project List</button>
    </div>
    
    <div id="runningTotalSection" class="running-total-section" style="display: none;">
      <div class="running-total-title">Project Estimate</div>
      
      <div class="task-list">
        <table class="task-table">
          <thead>
            <tr>
              <th>Task</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="runningTotalBody">
            <!-- Tasks will be added here -->
          </tbody>
        </table>
      </div>
      
      <div class="total-section">
        Total: $<span id="runningTotalAmount">0.00</span>
      </div>
    </div>
  </div>
  
  <script>
    // Pricing data
    const pricingData = {
      "plumbing_leak": {
        "label": "Fix a Plumbing Leak",
        "handyman": [75, 150],
        "contractor": [150, 350]
      },
      "electrical_outlet": {
        "label": "Install Electrical Outlet",
        "handyman": [100, 175],
        "contractor": [200, 400]
      },
      "drywall_repair": {
        "label": "Drywall Repair",
        "handyman": [75, 150],
        "contractor": [150, 300]
      },
      "door_repair": {
        "label": "Door Repair/Replacement",
        "handyman": [100, 250],
        "contractor": [200, 500]
      },
      "window_repair": {
        "label": "Window Repair",
        "handyman": [100, 200],
        "contractor": [200, 400]
      },
      "ceiling_fan": {
        "label": "Install Ceiling Fan",
        "handyman": [100, 200],
        "contractor": [200, 400]
      },
      "light_fixture": {
        "label": "Install Light Fixture",
        "handyman": [75, 150],
        "contractor": [150, 300]
      },
      "toilet_repair": {
        "label": "Toilet Repair",
        "handyman": [100, 200],
        "contractor": [200, 400]
      },
      "faucet_replacement": {
        "label": "Faucet Replacement",
        "handyman": [100, 200],
        "contractor": [200, 400]
      },
      "garbage_disposal": {
        "label": "Garbage Disposal Installation",
        "handyman": [125, 250],
        "contractor": [250, 500]
      },
      "cabinet_repair": {
        "label": "Cabinet Repair",
        "handyman": [100, 200],
        "contractor": [200, 400]
      },
      "countertop_repair": {
        "label": "Countertop Repair",
        "handyman": [150, 300],
        "contractor": [300, 600]
      },
      "tile_repair": {
        "label": "Tile Repair",
        "handyman": [100, 200],
        "contractor": [200, 400]
      },
      "flooring_repair": {
        "label": "Flooring Repair",
        "handyman": [100, 250],
        "contractor": [200, 500]
      },
      "paint_room": {
        "label": "Paint a Room",
        "handyman": [200, 400],
        "contractor": [400, 800]
      },
      "fence_repair": {
        "label": "Fence Repair",
        "handyman": [150, 300],
        "contractor": [300, 600]
      },
      "deck_repair": {
        "label": "Deck Repair",
        "handyman": [200, 400],
        "contractor": [400, 800]
      },
      "gutter_cleaning": {
        "label": "Gutter Cleaning",
        "handyman": [100, 200],
        "contractor": [200, 400]
      },
      "pressure_washing": {
        "label": "Pressure Washing",
        "handyman": [150, 300],
        "contractor": [300, 600]
      },
      "tv_mounting": {
        "label": "TV Mounting",
        "handyman": [100, 200],
        "contractor": [200, 400]
      }
    };
    
    // Global variables
    var tasksList = [];
    var currentEstimate = null;
    var taskIdCounter = 1;
    
    // Initialize the task dropdown
    window.onload = function() {
      const taskSelect = document.getElementById("task");
      for (const key in pricingData) {
        const opt = document.createElement("option");
        opt.value = key;
        opt.innerText = pricingData[key].label;
        taskSelect.appendChild(opt);
      }
    };
    
    // Calculate and show estimate
    function showEstimate() {
      const taskKey = document.getElementById("task").value;
      const quantity = parseInt(document.getElementById("quantity").value) || 1;
      const data = pricingData[taskKey];
      const estimateBox = document.getElementById("estimateBox");
      const icon = document.getElementById("icon");
      const addBtn = document.getElementById("addBtn");
      
      // Calculate average prices
      const handymanAvg = Math.round((data.handyman[0] + data.handyman[1]) / 2);
      const contractorAvg = Math.round((data.contractor[0] + data.contractor[1]) / 2);
      
      // Store current estimate for adding to list
      currentEstimate = {
        id: taskIdCounter++,
        taskKey: taskKey,
        label: data.label,
        quantity: quantity,
        handymanCost: handymanAvg * quantity,
        contractorCost: contractorAvg * quantity
      };
      
      // Update the estimate box with formatted HTML
      estimateBox.innerHTML = 
        "<strong>" + data.label + " (x" + quantity + ")</strong><br><br>" +
        "<strong>Independent Handyman:</strong><br>" +
        "<span class='price-highlight'>$" + (data.handyman[0] * quantity) + "</span>" +
        "<span class='range-separator'>—</span>" +
        "<span class='price-highlight'>$" + (data.handyman[1] * quantity) + "</span><br><br>" +
        "<strong>Licensed Contractor:</strong><br>" +
        "<span class='price-highlight'>$" + (data.contractor[0] * quantity) + "</span>" +
        "<span class='range-separator'>—</span>" +
        "<span class='price-highlight'>$" + (data.contractor[1] * quantity) + "</span><br><br>" +
        "<strong>Average Cost:</strong><br>" +
        "<span class='price-highlight'>$" + (handymanAvg * quantity) + "</span> (handyman) / " +
        "<span class='price-highlight'>$" + (contractorAvg * quantity) + "</span> (contractor)";
      
      // Show the Add to List button
      addBtn.style.display = "block";
    }
    
    // Add current estimate to the list
    function addToList() {
      if (!currentEstimate) return;
      
      // Add to tasks list
      tasksList.push(currentEstimate);
      
      // Update the running total UI
      updateRunningTotal();
      
      // Reset the form
      document.getElementById("quantity").value = "1";
      document.getElementById("estimateBox").innerHTML = "Select a task to see pricing information.";
      document.getElementById("addBtn").style.display = "none";
      
      // Clear current estimate
      currentEstimate = null;
    }
    
    // Update the running total table and total
    function updateRunningTotal() {
      const runningTotalSection = document.getElementById("runningTotalSection");
      const runningTotalBody = document.getElementById("runningTotalBody");
      const runningTotalAmount = document.getElementById("runningTotalAmount");
      
      // Clear existing table rows
      runningTotalBody.innerHTML = "";
      
      // Calculate total cost
      let total = 0;
      for (let i = 0; i < tasksList.length; i++) {
        total += tasksList[i].handymanCost;
      }
      
      // Update total amount display
      runningTotalAmount.textContent = total.toFixed(2);
      
      // Add each task to the table
      for (let i = 0; i < tasksList.length; i++) {
        const task = tasksList[i];
        const row = document.createElement("tr");
        
        // Task name cell
        const nameCell = document.createElement("td");
        nameCell.textContent = task.label;
        
        // Quantity cell
        const qtyCell = document.createElement("td");
        qtyCell.textContent = task.quantity;
        
        // Price cell
        const priceCell = document.createElement("td");
        priceCell.textContent = "$" + task.handymanCost.toFixed(2);
        
        // Action cell with delete button
        const actionCell = document.createElement("td");
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-btn";
        deleteBtn.textContent = "Delete";
        deleteBtn.onclick = function() {
          removeTask(task.id);
        };
        actionCell.appendChild(deleteBtn);
        
        // Add all cells to the row
        row.appendChild(nameCell);
        row.appendChild(qtyCell);
        row.appendChild(priceCell);
        row.appendChild(actionCell);
        
        // Add the row to the table
        runningTotalBody.appendChild(row);
      }
      
      // Show/hide running total section based on whether we have tasks
      if (tasksList.length > 0) {
        runningTotalSection.style.display = "block";
      } else {
        runningTotalSection.style.display = "none";
      }
    }
    
    // Remove a task from the list
    function removeTask(id) {
      // Filter out the task with the given id
      tasksList = tasksList.filter(function(task) {
        return task.id !== id;
      });
      
      // Update the running total UI
      updateRunningTotal();
    }
  </script>
</body>
</html>`;

  // Write the updated content to calculator.html
  fs.writeFileSync('calculator.html', calculatorHtml);
  console.log('Created calculator.html with full item list'.green);
  
  // Also update the original file to ensure it has the latest content
  fs.writeFileSync("While You're Here Calculator", calculatorHtml);
  console.log('Updated original calculator file'.green);
  
  // Create index.html that redirects to calculator.html
  const indexContent = `<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="refresh" content="0; url='calculator.html'" />
</head>
<body>
    Redirecting to calculator...
</body>
</html>`;
  
  fs.writeFileSync('index.html', indexContent);
  console.log('Updated index.html'.green);
  
  console.log('Setup complete! The calculate button is fuchsia (#FF00FF) and running total is enabled.'.green.bold);
  
} catch (err) {
  console.error('Error during setup:'.red, err);
}
