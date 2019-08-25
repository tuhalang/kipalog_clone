"use strict"

// switch tab account and password
const btn_password = document.getElementById('password-btn');
const btn_account = document.getElementById('account-btn');
const content_password = document.getElementsByClassName('content-password')[0];
const content_account = document.getElementsByClassName('content-account')[0];

btn_password.onclick = function() {
    content_account.style.display = 'none';
    content_password.style.display = 'block';
    btn_password.classList.add("btn-password-active");
    btn_account.classList.remove("btn-account-active");
}


btn_account.onclick = function() {
    content_account.style.display = 'block';
    content_password.style.display = 'none';
    btn_account.classList.add("btn-account-active");
    btn_password.classList.remove("btn-password-active");
}

const change_avatar = document.getElementById('block-avatar');

change_avatar.onclick = openOverlay;


/* Open */
function openOverlay() {
    document.getElementById("myoverlay").style.display = "block";
}

/* Close */
function closeOverlay() {
    document.getElementById("myoverlay").style.display = "none";
}