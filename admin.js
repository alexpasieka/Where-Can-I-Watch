// showing loading spinner
app.toggleSpinner = "display: inline-block";

// referencing database when data updates
firebase.database().ref("searchTerms").on("value", dataChanged);

// callback function
function dataChanged(data) {
	let obj = data.val();
	let bigString = "";

	let i = 0;
	let count = 0;
	// iterate through object children
	for (let key in obj) {
		// updating frequency count
		firebase.database().ref('searchTerms/' + key).once('value', function(snapshot) {
			count = snapshot.numChildren();
		});

		// injecting HTML
		bigString += `<tr><td>${key}</td>
					  <td>${count}</td></tr>`;
		app.tableContent = bigString;

		i++;
	}

	// hiding loading spinner
	app.toggleSpinner = "display: none";
}