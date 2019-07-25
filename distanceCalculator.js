Vue.component('distance-result', {
    template: '\
    <li>\
      {{ result }}\
    </li>\
  ',
    props: ['result']
});

let distanceCalculator = new Vue({
    el: '#distance-calculator',
    data: {
        answers: [],
        firstCity: '',
        secondCity: '',
        hasError: false,
        isDisabled: 0
    },

    methods: {
        calculateDistance: function () {
            let vm = this;

            vm.isDisabled = 1;

            let placeIdsData = new Promise((resolve, reject) => {

                this.getPlaceIdByCityName(this.firstCity)
                    .then(
                        firstCityPlaceId => {
                            this.getPlaceIdByCityName(this.secondCity)
                                .then(
                                    secondCityPlaceId => {
                                        resolve({
                                            firstCityPlaceId: firstCityPlaceId,
                                            secondCityPlaceId: secondCityPlaceId
                                        });
                                    }
                                )
                                .catch(
                                    error => {
                                        reject(new Error(error.message));
                                    });
                        }
                    )
                    .catch(
                        error => {
                            reject(new Error(error.message));
                        });
            });

            placeIdsData
                .then(
                    result => {
                        this.getAnswer(result);
                    })
                .catch(
                    error => {
                        vm.answers.push({
                            result:
                                vm.getDateTime()
                                + ' '
                                + error.message,
                            hasError: true
                        });
                        vm.clear();
                        vm.isDisabled = 0;
                    });
        },

        getPlaceIdByCityName: function (cityName) {
            return new Promise((resolve, reject) => {
                axios.get(App.config.CROSS_DOMAIN_REQUEST_HANDLER
                    + App.config.GOOGLE_PLACE_API
                    + App.config.GOOGLE_API_OUTPUT_FORMAT
                    + '?input=' + cityName
                    + '&types=(cities)'
                    + '&key=' + App.config.GOOGLE_API_KEY)
                    .then(function (response) {

                        if (response.data.status !== 'OK') {
                            reject(new Error("City not found"));
                        } else {
                            resolve(response.data.predictions[0].place_id);
                        }
                    })
                    .catch(function (error) {
                        reject(new Error(error.data));
                    })
            });
        },

        getAnswer: function (result) {
            let vm = this;

            axios.get(App.config.CROSS_DOMAIN_REQUEST_HANDLER
                + App.config.GOOGLE_DISTANCE_MATRIX_API
                + App.config.GOOGLE_API_OUTPUT_FORMAT
                + '?origins=place_id:' + result.firstCityPlaceId
                + '&destinations=place_id:' + result.secondCityPlaceId
                + '&mode=' +  App.config.GOOGLE_DISTANCE_MATRIX_MODE
                + '&key=' + App.config.GOOGLE_API_KEY)
                .then(function (response) {
                    if (response.data.status !== 'OK') {
                        vm.answers.push({
                            result:
                                vm.getDateTime()
                                + ' '
                                + 'Could not calculate distance',
                            hasError: true
                        })

                    } else {
                        if (response.data.rows[0].elements[0].status !== 'OK') {
                            vm.answers.push({
                                result:
                                    vm.getDateTime()
                                    + ' '
                                    + 'Could not calculate distance',
                                hasError: true
                            })

                        } else {
                            vm.answers.push({
                                result:
                                    vm.getDateTime()
                                    + ' '
                                    + vm.firstCity
                                    + ' - '
                                    + vm.secondCity
                                    + ' = '
                                    + response.data.rows[0].elements[0].distance.text
                            });
                        }
                    }
                    vm.clear();
                    vm.isDisabled = 0;
                })
                .catch(function (error) {
                    vm.answers.push({
                        result:
                            vm.getDateTime()
                            + ' '
                            + error.data,
                        hasError: true
                    });
                    vm.clear();
                    vm.isDisabled = 0;
                })
        },

        clear: function () {
            this.firstCity = '';
            this.secondCity = '';
        },

        getDateTime: function () {
            const date = new Date;

            return [
                    date.getMonth() + 1,
                    date.getDate()
                ].join('/') + ' ' +
                [
                    date.getHours(),
                    date.getMinutes()
                ].join(':');
        }
    }
});