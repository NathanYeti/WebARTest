// Initialize Firebase
var config = {
    apiKey: "AIzaSyB47QIRCSSfBnuiBcx8NUxTX3xxa9kKyRQ",
    authDomain: "grpmtest-835ca.firebaseapp.com",
    databaseURL: "https://grpmtest-835ca.firebaseio.com",
    projectId: "grpmtest-835ca",
    storageBucket: "",
    messagingSenderId: "109196037396"
};
firebase.initializeApp(config);


// gets a reference to the Fish data in the database
var database = firebase.database().ref().child('Fish');
var fishlist = firebase.database().ref().child('FishList');

/*
// retrieves data from the database
database.once('value', snap => {
    // prints database in a readable string format
    console.log(JSON.stringify(snap.val(), null, 3));
    // prints database in an array
    console.log(snap.val());
});

// adds a new fish to the database (tested)
firebase.database().ref('Fish/Bob').set({
    age: 200,
});

// for updating multiple objects at once you can pass in a list of changes, then call the update function with the list of changes
var updates = {};
updates['Fish/Fred'] = {length: 50};
updates['Fish/George'] = {age: 300, length: 50};

firebase.database().ref().update(updates);

// removes specified data
// if you would rather do everything passed into updates, you can specify null for the object you want to delete.
firebase.database().ref('Fish/Fred').remove();

var database = firebase.database().ref().child('Fish');
database.once('value', snap => {
    console.log(JSON.stringify(snap.val(), null, 3));
    var fisharray = snap.val();
    console.log(fisharray);
    for (x in fisharray) {
        console.log(x);
        console.log(fisharray[x]);
    };
});
*/