// Flag to keep track if a session is in progress
let sessionInProgress = false;

// Array to store the xpaths
let xpaths = [];

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  // If the message type is "startSession"
  if (request.type === "startSession") {
    sessionInProgress = true;
    startSession(sendResponse);
    return true;
  }

  // If the message type is "csvFileProvided"
  if (request.type === "csvFileProvided") {
    xpaths = request.xpaths;
    sendResponse();
  }

  // If the message type is "sessionEnded"
  if (request.type === "sessionEnded") {
    sessionInProgress = false;
    endSession(request.filePath);
    sendResponse();
  }
});

// Ask the popup for the csv file
function startSession(sendResponse) {
  chrome.runtime.sendMessage({ type: "askForCsvFile" }, function(response) {
    // If the xpaths are provided
    if (response.xpaths) {
      xpaths = response.xpaths;
      sendResponse({ sessionStarted: true });
    } else {
      sendResponse({ sessionStarted: false });
    }
  });
}

// Extract text from xpaths and save to a CSV file
function endSession(filePath) {
  let data = [];

  // Loop through the xpaths and extract the text from each element
  for (let i = 0; i < xpaths.length; i++) {
    let xpath = xpaths[i];
    let element = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    if (element) {
      let text = element.textContent;
      data.push({ field: i + 1, xpath: text });
    }
  }

  // Create a string in CSV format from the data
  let csvContent = "data:text/csv;charset=utf-8,";
  data.forEach(function(rowArray) {
    let row = rowArray.field + "," + rowArray.xpath + "\n";
    csvContent += row;
  });

  // Encode the CSV content as a URI
  let encodedUri = encodeURI(csvContent);

  // Create a download link for the CSV file
  let link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "xpath_data.csv");
  document.body.appendChild(link); // Required for Firefox

  // Trigger the download of the CSV file
  link.click();
}
