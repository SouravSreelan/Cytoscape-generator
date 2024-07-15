document
.getElementById("submitButton")
.addEventListener("click", handleSubmit, false);

function handleSubmit(e) {
e.preventDefault();
const fileInput = document.getElementById("fileInput");
const file = fileInput.files[0];
 
if (file) {
  const reader = new FileReader();

  reader.onload = function (event) {
    const data = new Uint8Array(event.target.result);
    const workbook = XLSX.read(data, { type: "array" });

    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
      header: 1,
    });

    const { nodes, edges, minWeight, maxWeight, threshold, nodesWithoutEdges } = processData(jsonData);

    initializeCytoscape(nodes.concat(edges), minWeight, maxWeight, threshold, nodesWithoutEdges);

    document.getElementById("fileForm").style.display = "none";
    document.getElementById("cy").classList.remove("hidden")
  };

  reader.readAsArrayBuffer(file);
} else {
  alert("Please choose a file before submitting.");
}   
}

function processData(data) {
    const nodes = [];
    const edges = [];
    const nodesWithoutEdges = [];
  
    const headers = data[0].slice(1);
    let maxWeight = 0;
    let minWeight = Infinity;
  
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      for (let j = 1; j < row.length; j++) {
        const weights = row[j].split(",").map(Number);
        if (weights.length > 1) {
          maxWeight = Math.max(maxWeight, ...weights);
          console.log(maxWeight)
          minWeight = Math.min(minWeight, ...weights);
          console.log(minWeight)
        }
      }
    }
  
    const threshold = maxWeight / 2;
    console.log(threshold)
  
    headers.forEach((node) => {
      nodes.push({ data: { id: node, label: formatLabel(node) } });
    });  
  
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const source = row[0];
  
      for (let j = 1; j < row.length; j++) {
        const target = headers[j - 1];
        const weights = row[j].split(",").map(Number);
  
        if (source !== target && weights.length > 1) { 
          const weight1 = weights[0];
          const weight2 = weights[1];
  
          if (weight1 >= threshold) {
            edges.push({
              data: {
                id: `${source}-${target}-1`,
                source: source,
                target: target,
                weight: weight1,
                color: "#AAD8FF",
                controlPointDistance: 10,
              },
            });
          }
          if (weight2 >= threshold) {
            edges.push({
              data: {
                id: `${source}-${target}-2`,
                source: source,
                target: target,
                weight: weight2,
                color: "#D0D0D0",
                controlPointDistance: -10,
              },
            });
          }
        }
      }
    }
    headers.forEach((node) => {
        if (!edges.some((edge) => edge.data.source === node || edge.data.target === node)) {
            nodesWithoutEdges.push({ data: { id: node, label: formatLabel(node) } });
        }
    });

    return { nodes, edges, minWeight, maxWeight, threshold, nodesWithoutEdges };
  }
  function formatLabel(label) {
    return label.replace(/_/g, '\n');
  }
  
  

function initializeCytoscape(elements, minWeight, maxWeight, threshold, nodesWithoutEdges) {
    const cy= cytoscape({
  container: document.getElementById("cy"),
  elements: elements,
  style: [
    {
      selector: "node",
      style: {
        label: "data(label)",
        width: "50px",
        height: "50px",
        "background-color": "#394855",
        "text-valign": "center",
        "font-size": "8px",
        color: "#AAD8FF",
        "text-wrap": "wrap",
        "text-max-width": "50px",
      },
    },
    {
      selector: "edge",
      style: {
        width: `mapData(weight, ${threshold}, ${maxWeight}, 0.5, 6)`,
        "line-color": "data(color)",
        "control-point-distance": "data(controlPointDistance)",
      },
    },
  ],
  layout: {
    name: "cose",
    idealEdgeLength: 300,
    nodeOverlap: 50,
    refresh: 20,
    fit: true,
    animate: 'end',
    padding: 30,
    randomize: false,
    componentSpacing: 200,
    nodeRepulsion: 800000,
    edgeElasticity: 100,
    nestingFactor: 25,
    gravity: 80,
    numIter: 1000,
    initialTemp: 200,
    coolingFactor: 0.95,
    minTemp: 1.0,
    avoidOverlap: true,
    userZoomingEnabled: true, 
      panningEnabled: true,
  },
  
});
nodesWithoutEdges.forEach((nodeWithoutEdge) => {
    const existingNode = cy.$(`node[id = '${nodeWithoutEdge.data.id}']`);
    if (existingNode.length > 0) {
      existingNode.remove();
    }
  });
const stepY = 100;
    let posY = 100;

    nodesWithoutEdges.forEach((node, index) => {
        const uniqueId = `${node.data.id}_${index}`;
        node.data.id = uniqueId;

        cy.add({
            group: "nodes",
            data: node.data,
            position: { x: 250 * 6.1, y: posY }, 
        });

        posY += stepY;
    });

    cy.fit();

}  
