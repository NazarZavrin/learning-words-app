"use strict";
import Word from "./class_Word.js";
import { setWarning, createWarningAfterElement, showModalWindow, createElement, showPassword, renderSortedWords} from "./useful.js";
export default class Group {
    constructor(params) {
        // group creation
    }
    static viewGroup(groupName, ...synchronousCallbacks){
        if (!groupName) {
            console.log("viewGroup() error: groupName is " + groupName);
        }
        fetch(location.href + '/groups/view', {
            method: 'PROPFIND',
            body: groupName,
        })
        .then(response => {
            console.log(response);
            console.log(response.status);
            console.log(response.ok);
            if (response.ok) {
                return response.text();
            } else {
                throw new Error("Couldn't get group " + groupName);
            }
        })
        .then(result => {
            console.log(result);
            console.log(typeof result);
            console.log(result.constructor.name);
            // console.log(result.slice(0, 50));
            if (result.includes("view-group")) {
                document.body.insertAdjacentHTML("afterbegin", result);
                return Group.showWords(groupName)
                // addHandlersToViewGroupBlock(groupName);
            } else if (result === "failure") {
                throw new Error("Couldn't get group " + groupName);
            }
            else {
                throw new Error(result);
            }
        })
        .then(result => {
            for (const callback of synchronousCallbacks) {
                callback(groupName);
            }
        })
        .catch(error => {
            alert(error);
        })
    }
    static async showWords(groupName) {
        let viewGroupBlock = document.body.querySelector("#view-group");
        let wordsSection = viewGroupBlock.querySelector(".words-section");
        wordsSection.classList.add("loading");
        // return;
        let response = await fetch(location.href + '/groups/get-words', {
            method: 'PROPFIND',
            body: groupName,
        })
        let result = {};
        if (response.ok) {
            result = await response.json();
            // console.log(result);
            if (typeof result.words === "string") {
                result.words = JSON.parse(result.words);
                // console.log(result.words);
            }
        }
        wordsSection.classList.remove("loading");
        if (!result.success) {
            result.message = String(result?.message || "Can not get words of group " + groupName);
            wordsSection.textContent = result.message;
            return;
        }
        // await new Promise((resolve, reject) => {
        //     setTimeout(() => resolve(1), 1000);// to see how the loading icon works
        // })
        
        
        if (result.words.length === 0) {
            wordsSection.textContent = "Group doesn't contain any word.";
        } else {
            result.words = result.words.map(wordObject => {
                return new Word(wordObject);
            })
            renderSortedWords(wordsSection, result.words);
        }
    }
    static addWord(groupName, wordsSection) {
        let wordLabel = createElement({name: "header", content: "Enter new word:"},);
        let wordInput = createElement({name: "input"});
        wordInput.setAttribute("autocomplete", "off");
        let translationLabel = createElement({name: "header", content: "Enter the translation of new word:"},);
        let translationInput = createElement({name: "input"});
        translationInput.setAttribute("autocomplete", "off");
        let addNewWordBtn = createElement({content: "Add new word", class: "add-new-word-btn"});
        addNewWordBtn.addEventListener("click", async event => {
            createWarningAfterElement(addNewWordBtn);
            setWarning(addNewWordBtn.nextElementSibling, '');
            let everythingIsCorrect = true;
            if (wordInput.value.length == 0) {
                createWarningAfterElement(wordInput);
                setWarning(wordInput.nextElementSibling, "Please, enter new word.", "wordInput");
                everythingIsCorrect = false;
            } else if (wordInput.value.length > 20) {
                createWarningAfterElement(wordInput);
                setWarning(wordInput.nextElementSibling, "Length of new word must not exceed 20 characters.", "wordInput");
                everythingIsCorrect = false;
            } else {
                setWarning(wordInput.nextElementSibling, "");
            }
            if (translationInput.value.length == 0) {
                createWarningAfterElement(translationInput);
                setWarning(translationInput.nextElementSibling, "Please, enter the translation of new word.", "translationInput");
                everythingIsCorrect = false;
            } else if (translationInput.value.length > 20) {
                createWarningAfterElement(translationInput);
                setWarning(translationInput.nextElementSibling, "Length of translation must not exceed 20 characters.", "translationInput");
                everythingIsCorrect = false;
            } else {
                setWarning(translationInput.nextElementSibling, "");
            }
            if (everythingIsCorrect === false) {
                return;
            }
            console.log(wordInput.value);
            let requestBody = {
                groupName,// groupName: groupName,
                word: wordInput.value,
                translation: translationInput.value,
            };
            // return;
            let response = await fetch(location.href + "/groups/add-word", {
                method: "PUT",
                body: JSON.stringify(requestBody),
                headers: {
                    'Content-Type': 'application/json',
                }
            })
            let result = {};
            if (response.ok) {
                result = await response.json();
                console.log(result);
                if (result.success) {
                    event.target.closest(".modal-window").closeWindow();
                    if (!wordsSection.querySelector(".word-container")) {// if there arent any words in the section...
                        wordsSection.innerHTML = "";// ...erase the message "Group doesn't contain any word."
                    }
                    let wordContainers = [...wordsSection.getElementsByClassName("word-container")];
                    wordContainers.push(new Word({...requestBody, number: result.number}));
                    // console.log(wordContainers.slice(-3));
                    renderSortedWords(wordsSection, wordContainers);
                    return;
                }
            }
            result.message = String(result?.message || "Creation error. Please try again.");
            createWarningAfterElement(addNewWordBtn);
            setWarning(addNewWordBtn.nextElementSibling, result.message, "addNewWordBtn");
            console.log(result?.message);
        })
        showModalWindow(document.body, [wordLabel, wordInput, translationLabel, translationInput, addNewWordBtn], 
            {className: "new-word-modal-window"});
    }
    static changeGroupName(groupNameBlock){
        // console.log("changeGroupName");
        let newGroupNameLabel = createElement({name: "header", content: "Enter new name of group:"},);
        let newGroupNameInput = createElement({name: "input"});
        newGroupNameInput.setAttribute("autocomplete", "off");
        newGroupNameInput.value = groupNameBlock.textContent;
        let passwordLabel = createElement({name: "header", content: "To verify personality enter your password:"},);
        let passwordInput = createElement({name: "input"});
        passwordInput.setAttribute("type", "password");
        passwordInput.setAttribute("autocomplete", "off");
        let passwordBlock = createElement({name: "form", class: "password-block"});
        passwordBlock.innerHTML = `<div class="show-password">
        <input type="checkbox">Show password</div>`;
        passwordBlock.prepend(passwordInput);
        let changeGroupNameBtn = createElement({content: "Change name of group", class: "change-group-name-btn"});
        changeGroupNameBtn.addEventListener("click", async event => {
            createWarningAfterElement(changeGroupNameBtn);
            setWarning(changeGroupNameBtn.nextElementSibling, '');
            let everythingIsCorrect = true;
            if (newGroupNameInput.value.length == 0) {
                createWarningAfterElement(newGroupNameInput);
                setWarning(newGroupNameInput.nextElementSibling, "Please, enter new name of group.", "newGroupNameInput");
                everythingIsCorrect = false;
            } else if (newGroupNameInput.value.length > 20) {
                createWarningAfterElement(newGroupNameInput);
                setWarning(newGroupNameInput.nextElementSibling, "Length of new name must not exceed 20 characters.", "newNameInput");
                everythingIsCorrect = false;
            } else if (newGroupNameInput.value === groupNameBlock.textContent) {
                createWarningAfterElement(newGroupNameInput);
                setWarning(newGroupNameInput.nextElementSibling, "Old and new name of group coincide.", "newNameInput");
                everythingIsCorrect = false;
            } else {
                setWarning(newGroupNameInput.nextElementSibling, "");
            }
            if (passwordInput.value.length === 0) {
                createWarningAfterElement(passwordInput);
                setWarning(passwordInput.nextElementSibling, "Please, enter password.", "passwordInput");
                everythingIsCorrect = false;
            } else {
                setWarning(passwordInput.nextElementSibling, "");
            }
            if (everythingIsCorrect === false) {
                return;
            }
            // console.log(newGroupNameInput.value);
            let requestBody = {
                oldGroupName: groupNameBlock.textContent,
                newGroupName: newGroupNameInput.value,
                password: passwordInput.value,
            };
            // return;
            let response = await fetch(location.href + "/groups/change/name", {
                method: "PATCH",
                body: JSON.stringify(requestBody),
                headers: {
                    'Content-Type': 'application/json',
                }
            })
            let result = {};
            if (response.ok) {
                result = await response.json();
                console.log(result);
                // console.log(Date.now());
                if (result.success) {
                    event.target.closest(".modal-window").closeWindow();
                    groupNameBlock.textContent = result.newGroupName;
                    return;
                }
            }
            if (result?.message?.includes("Password don't match")) {
                createWarningAfterElement(passwordInput);
                setWarning(passwordInput.nextElementSibling, result.message, "passwordInput");
                return;
            }
            result.message = String(result?.message || "Updating error. Please try again.");
            createWarningAfterElement(changeGroupNameBtn);
            setWarning(changeGroupNameBtn.nextElementSibling, result.message, "changeGroupNameBtn");
            console.log(result?.message);
        })
        function clickModalWindow(event) {
            if (passwordInput) {
                showPassword([".show-password"], passwordInput, event);
            }
        }
        showModalWindow(document.body, [newGroupNameLabel, newGroupNameInput, passwordLabel, passwordBlock, changeGroupNameBtn], 
            {className: "change-group-name-modal-window", handlers: [{eventName: "click", handler: clickModalWindow}]});
    }
    static async changeGroupStatus(groupName, changeStatusBlock) {
        let response = await fetch(location.href + "/groups/change/status", {
            method: "PATCH",
            body: groupName,
        })
        let result = {};
        if (response.ok) {
            result = await response.json();
            console.log(result);
            // console.log(Date.now());
            if (result.success) {
                let span = changeStatusBlock.querySelector("span");
                let starIcon = changeStatusBlock.querySelector("div.star-icon");
                if (result.groupIsFavoutite === true) {
                    span.textContent = "Remove from favourites";
                    starIcon.classList.add("crossed-out");
                } else {
                    span.textContent = "Add to favourites";
                    starIcon.classList.remove("crossed-out");
                }
                return;
            }
        }
        result.message = String(result?.message || "Updating error. Please try again.");
        alert(result?.message);
    }
    static deleteGroup(groupNameBlock){
        let header = createElement({name: "header", content: "To verify personality enter your password:"},);
        let passwordInput = createElement({name: "input"});
        passwordInput.setAttribute("type", "password");
        passwordInput.setAttribute("autocomplete", "off");
        let passwordBlock = createElement({name: "form", class: "password-block"});
        passwordBlock.innerHTML = `<div class="show-password">
        <input type="checkbox">Show password</div>`;
        passwordBlock.prepend(passwordInput);
        let checkPasswordBtn = createElement({content: "Delete group", class: "check-password-btn"});
        checkPasswordBtn.addEventListener("click", async event => {
            createWarningAfterElement(checkPasswordBtn);
            setWarning(checkPasswordBtn.nextElementSibling, '');
            let everythingIsCorrect = true;
            if (passwordInput.value.length === 0) {
                createWarningAfterElement(passwordInput);
                setWarning(passwordInput.nextElementSibling, "Please, enter password.", "passwordInput");
                everythingIsCorrect = false;
            } else {
                setWarning(passwordInput.nextElementSibling, "");
            }
            if (everythingIsCorrect === false) {
                return;
            }
            // console.log(passwordInput.value);
            // return;
            let response = await fetch(location.href + "/groups/delete", {
                method: "DELETE",
                body: JSON.stringify({
                    groupName: groupNameBlock.textContent,
                    password: passwordInput.value
                }),
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            let result = {};
            if (response.ok) {
                result = await response.json();
                console.log(result);
                if (result.success) {
                    event.target.closest(".modal-window").closeWindow();
                    // console.log(groupNameBlock);
                    // console.log(groupNameBlock.parentElement);
                    let backBtn = groupNameBlock.parentElement.querySelector(".back");
                    // console.log(backBtn);
                    backBtn.click();
                    return;
                }
            }
            if (result?.message?.includes("Password don't match")) {
                createWarningAfterElement(passwordInput);
                setWarning(passwordInput.nextElementSibling, result.message, "passwordInput");
                return;
            }
            result.message = String(result?.message || "Deletion error. Please try again.");
            createWarningAfterElement(checkPasswordBtn);
            setWarning(checkPasswordBtn.nextElementSibling, result.message, "checkPasswordBtn");
            console.log(result?.message);
        })
        function clickModalWindow(event) {
            if (passwordInput) {
                showPassword([".show-password"], passwordInput, event);
            }
        }
        showModalWindow(document.body, [header, passwordBlock, checkPasswordBtn], 
        {className: "check-password-modal-window", handlers: [{eventName: "click", handler: clickModalWindow}]});
    }
}