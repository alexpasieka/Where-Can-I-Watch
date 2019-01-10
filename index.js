// ES6 class for data
class Result {
	constructor(title, year, poster) {
		this.title = title;
		this.year = '(' + year + ')';
		this.poster = poster;
	}
}

// masthead
Vue.component('masthead', {
	props: ['title', 'instructions'],
	template: `
		<div class="masthead">
            <h1>{{title}}</h1>
            <p>{{instructions}}</p>
        </div>
    `
});

// main Vue
const app = new Vue({
	el: '#app',
	data: {
		title: "Where Can I Watch?",
		instructions: "Search for your favorite movies and TV shows to see where they are available to stream.",
		result: {},
		currentResult: {},
		availability: "",
		lastSearch: localStorage.getItem('lastSearch'),
		term: "",
		type: "",
		page: 1,
		toggleSpinner: "display: none",
		togglePagination: "display: none",
		tableContent: ""
	},
	methods: {
		// search the OMBDb API based on the given search term
		search(term, type, page) {
			// resetting pagination
			if (page === 1) {
				this.page = 1;
			}

			// showing loading spinner
			this.toggleSpinner = "display: inline-block";
			// hiding pagination while loading
			this.togglePagination = "display: none";

			// resetting result object
			this.result = {};

			// fetching data
			fetch("https://www.omdbapi.com/?s=" + term + "&type=" + type + "&page=" + page + "&apikey=a2c11b79")
				.then(response => {
					// error handling
					if (!response.ok) {
						throw Error(`ERROR: ${response.statusText}`);
					}
					// passing on data
					return response.json();
				})
				.then(json => {
					// filling new array with data
					let results = [];
					if (json.Search !== undefined) {
						for (let result of json.Search) {
							let r = new Result(result.Title, result.Year, result.Poster);
							results.push(r);
						}
						this.result = results;

						// showing pagination
						this.togglePagination = "display: inline";
					}
					else {
						// hiding pagination if threre are no results
						this.togglePagination = "display: none";
					}

					// hiding pagination if there are not enough results
					if (results.length !== 10) {
						this.togglePagination = "display: none";
					}

					// hiding loading spinner
					this.toggleSpinner = "display: none";

					// saving last search term in local storage
					localStorage.setItem('lastSearch', term);

					// setting term to none if empty
					if (term === "") {
						term = "(none)";
					}

					// saving search term in firebase based on time stamp
					firebase.database().ref('searchTerms/' + term).push({
						timeStamp: new Date().toString()
					});
				});
		},
		// search the Utelly API for streaming availabilities
		searchAvailability(result) {
			// loading feedback
			this.currentResult = {
				title: "Loading...",
				year: ""
			};
			this.availability = "";

			// fetching data
			fetch("https://utelly-tv-shows-and-movies-availability-v1.p.rapidapi.com/lookup?term=" + result.title, {
				// passing API key as header
				headers: new Headers({
					"X-RapidAPI-Key": "ECwc1Dd61vmshG20Fs7iPemQLEF8p1wa6MGjsnsq99PzvMBSSn"
				})
			})
				.then(response => {
					// error handling
					if (!response.ok) {
						throw Error(`ERROR: ${response.statusText}`);
					}
					// passing on data
					return response.json();
				})
				.then(json => {
					// changing current result
					this.currentResult = result;

					// if there are results, load them
					if (json.results.length > 0) {
						this.availability = json.results[0].locations;
					}
					// if there are no results, say so
					else {
						this.availability = [{}];
						this.availability[0].display_name = "This title is not available to stream.";
					}
				});
		},
		// previous pagination
		previousPage() {
			if (this.page > 1) {
				this.page--;
				this.search(this.term, this.type, this.page);
			}
		},
		// next pagination
		nextPage() {
			this.page++;
			this.search(this.term, this.type, this.page);
		}
	}
});