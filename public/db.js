let db;
const request = indexedDB.open("budget", 1);

request.onupgradeneeded = (event) => {
    const db = event.target.result
    db.createObjectStore("pending", {
        keyPath: "id",
        autoIncrement: true
    });
};

request.onerror = (err) => {
    console.log(err.message);
};

request.onsuccess = (event) => {
    db = event.target.result;

    if (navigator.onLine) {
        checkDatabase();
    }
};

// While offline, saves user's record
function saveRecord(record) {
    const transaction = db.transaction("pending", "readwrite");
    const store = transaction.objectStore("pending");
    store.add(record);
}

// Send transactions stored in db to server when connected to online
function checkDatabase() {
    const transaction = db.transaction("pending", "readonly");
    const store = transaction.objectStore("pending");
    const getAll = store.getAll();

    getAll.onsuccess = () => {
        if (getAll.result.length > 0) {
            fetch("/api/transaction/bulk", {
                method: "POST",
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: "application/json, text/plain, */*",
                    "Content-Type": "application/json"
                }
            })
                .then((response) => response.json())
                .then(() => {
                    const transaction = db.transaction("pending", "readwrite");
                    const store = transaction.objectStore("pending");
                    store.clear();
                });
        }
    };
}

// listen for app coming back online
window.addEventListener("online", checkDatabase);