/*
Należy stworzyć prostą aplikację pozwalającą na wprowadzenie danych pojedynczego paragonu
(przykładowy wygląd przedstawiono na grafice poniżej). Powinna ona pozwalać na (liczba w nawiasach oznacza punktację):

wprowadzanie nowych pozycji paragonu (+1),
edycję istniejących pozycji (+1),
usuwanie ich (+1),
zmianę kolejności (+1).

Interfejsowo możecie rozwiązać to w dowolnie wybrany sposób.
Zadbajcie jednak o sprawdzanie poprawności wprowadzanych danych oraz przeliczanie sumy.
Zawartość listy przechowujcie w local storage (+1).

To zadanie należy rozwiązać opierając się wyłącznie na Plain JavaScript.

Zalecane podejście: przechowujcie reprezentację paragonu w postaci tablicy obiektów, a dopiero na tej podstawie budujcie dokument.
Manipulacja pozycjami powoduje zarówno aktualizację przechowywanego w pamięci modelu, jak i modyfikację widoku (fragmentu dokumentu).
 */

//zmienne globalne
const LOCALSTORAGE_RECEIPT_KEY = "receipt";

const dateElements = document.getElementsByClassName("receipt-date");
const sumElements = document.getElementsByClassName("receipt-total");
let dragged;

// paragon w postaci tablicy obiektów
let Receipt = [
    {
        name: "Jabłka Jonagold",
        unitPrice: 1.25,
        quanity: 0.35
    },
    {
        name: "Jabłka Golden Delicious",
        unitPrice: 1.15,
        quanity: 1.75
    }
];

// funkcje pomocnicze
/**
 * Dodaje wiodące zera do liczby
 * @param str liczba
 * @param zeros długość
 * @return {string}
 */
function pad(str, zeros) {
    str = str.toString();
    return str.length < zeros ? pad("0" + str, zeros) : str;
}

/**
 * Zapisuje liczbę w formacie ceny
 * @param price
 * @return {string}
 */
function normalizePrice(price) {
    let formatted = Math.round(price * 100) / 100;
    formatted = formatted.toFixed(2);
    return formatted;
}

/**
 * Odświeża elementy daty
 */
function updateDate() {
    const date = new Date(Date.now());
    const y = date.getFullYear(),
        m = date.getMonth() + 1,
        d = date.getDate(),
        h = date.getHours(),
        min = date.getMinutes();
    const dateString = `${y}-${pad(m, 2)}-${pad(d, 2)} ${pad(h, 2)}:${pad(min, 2)}`;

    for (let i = 0; i < dateElements.length; i++) {
        dateElements[i].innerText = dateString;
    }
}

/**
 * Odświeża tabelę z pozycjami paragonu
 */
function receiptChanged() {
    const tbody = document.querySelector("#receipt tbody");
    tbody.innerHTML = null;

    let sum = 0.0;
    for (let i = 0; i < Receipt.length; i++) {
        const position = Receipt[i];
        tbody.append(buildReceiptPosition(position));

        sum += position.quanity * position.unitPrice;
    }
    sum = normalizePrice(sum);

    for (let i = 0; i < sumElements.length; i++) {
        sumElements[i].innerText = sum;
    }
}


function dragStart(e) {
    let element = e.target;
    while(true) {
        if(typeof element?.tagName !== "undefined" && element?.tagName === "TR") {
            break;
        }
        else {
            if(typeof element?.parentElement !== "undefined")
                element = element.parentElement;
            else
                return;
        }
    }

    dragged = element;
}

function dragOver(e) {
    e.preventDefault();

    const draggedIndex = Number.parseInt(dragged.dataset.index);
    const tr = e.target.parentNode;
    const trIndex = Number.parseInt(tr.dataset.index);
    const children = Array.from(tr.parentNode.children); // all trs
    if (children.indexOf(tr) > children.indexOf(dragged)) {
        tr.after(dragged);
    } else {
        tr.before(dragged);
    }

    if (draggedIndex != trIndex) {
        const tempPosition = Receipt[trIndex];
        Receipt[trIndex] = Receipt[draggedIndex];
        Receipt[draggedIndex] = tempPosition;
        saveState();

        tr.dataset.index = "" + draggedIndex;
        dragged.dataset.index = "" + trIndex;
    }
}


/**
 * Przygotowuje wiersz pozycji paragonu
 * @param position
 * @return {HTMLTableRowElement}
 */
function buildReceiptPosition(position) {
    const tr = document.createElement("tr");
    tr.draggable = true;
    tr.ondragstart = dragStart;
    tr.ondragover = dragOver;
    const index = Receipt.findIndex((value) => value == position);
    tr.dataset.index = "" + index;

    const nameTd = document.createElement("td");
    nameTd.innerText = position.name;
    const taxRateTd = document.createElement("td");
    taxRateTd.innerText = "D";
    const quanityAndUnitPriceTd = document.createElement("td");
    quanityAndUnitPriceTd.innerText = `${position.quanity} x ${position.unitPrice}`;
    const priceTd = document.createElement("td");
    priceTd.innerText = "" + normalizePrice(position.unitPrice * position.quanity) + "D";

    const actionTd = document.createElement("td");
    const editImg = document.createElement("img");
    editImg.src = "assets/img/edit.svg";
    editImg.classList.add("icon");
    editImg.onclick = () => {
        document.getElementById("popup").classList.add('visible');
        document.getElementById("nameEdit").value = position.name;
        document.getElementById("quanityEdit").value = position.quanity;
        document.getElementById("unitPriceEdit").value = position.unitPrice;
        document.getElementById("editIndex").value = index;
    };
    actionTd.append(editImg);
    const deleteImg = document.createElement("img");
    deleteImg.src = "assets/img/delete.svg";
    deleteImg.classList.add("icon");
    deleteImg.onclick = () => {
        Receipt.splice(index, 1);
        receiptChanged();
        saveState();
    };
    actionTd.append(deleteImg);

    tr.append(nameTd);
    tr.append(taxRateTd);
    tr.append(quanityAndUnitPriceTd);
    tr.append(priceTd);
    tr.append(actionTd);
    return tr;
}

/**
 * Zapisuje obecny stan paragonu
 */
function saveState() {
    localStorage.setItem(LOCALSTORAGE_RECEIPT_KEY, JSON.stringify(Receipt));
}

/**
 * Wczytuje obecny stan paragonu
 */
function loadState() {
    const value = localStorage.getItem(LOCALSTORAGE_RECEIPT_KEY);
    if (value !== null) {
        Receipt = JSON.parse(value);
    }
}

// dodawanie pozycji
document.getElementById("add-item").onsubmit = (e) => {
    e.preventDefault();

    const data = new FormData(e.target);
    const position = {
        name: data.get("name"),
        unitPrice: data.get("unitPrice"),
        quanity: data.get("quanity")
    };
    Receipt.push(position);
    e.target.reset();
    receiptChanged();
    saveState();
};

// edytowanie pozycji
document.getElementById("edit-item").onsubmit = (e) => {
    e.preventDefault();

    const data = new FormData(e.target);
    const position = {
        name: data.get("name"),
        unitPrice: data.get("unitPrice"),
        quanity: data.get("quanity")
    };
    const index = Number.parseInt(data.get("index"));
    Receipt[index] = position;
    document.getElementById("popup").classList.remove('visible');
    e.target.reset();
    receiptChanged();
    saveState();
};

// zamkniecie wyskakujacego okienka
document.getElementById("popup").onclick = (e) => e.target.classList.remove("visible");






// inicjalizacja
(() => {
    loadState();
    updateDate();

    const now = new Date(Date.now());
    const nextMinuteIn = (60 - now.getSeconds()) * 1000;
    setTimeout(() => { // synchronizacja
        setInterval(updateDate, 60 * 1000); // odwiezanie aktualnej godziny
    }, nextMinuteIn);

    receiptChanged();
})();
