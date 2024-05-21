const calendarDayClass = 'visits-calendar__day'
const calendarDaySelectedClass = 'visits-calendar__day--selected'
const calendarDayGroupClass = 'visits-calendar__day-group'
const calendarDayGroupActiveClass = 'visits-calendar__day-group--active'

function handleSelectDate(event) {
  event.preventDefault()
  const dateToShow = event.target.parentElement.dataset.date

  // remove highlighted day
  document.querySelector(`.${calendarDaySelectedClass}`).classList.remove(calendarDaySelectedClass)

  // hide active form group
  document.querySelector(`.${calendarDayGroupActiveClass}`).classList.remove(calendarDayGroupActiveClass)

  // highlight selected day
  document.querySelector(`.${calendarDayClass}[data-date='${dateToShow}']`).classList.add(calendarDaySelectedClass)

  // show selected day's sessions
  const selectedFormGroup = document.querySelector(`.${calendarDayGroupClass}[data-date='${dateToShow}']`)
  selectedFormGroup.classList.add(calendarDayGroupActiveClass)

  // scroll to sessions if first input is not in viewport
  const firstSession = document.getElementById(`date-${dateToShow}`)
  const isFirstSessionInViewport = window.innerHeight <= firstSession.getBoundingClientRect().bottom
  if (isFirstSessionInViewport) {
    selectedFormGroup.scrollIntoView({ behavior: 'smooth' })
  }
  firstSession.focus()
}

if (document.body.classList.contains('govuk-frontend-supported')) {
  // handle clicks on the calendar days
  document.querySelectorAll(`.${calendarDayClass} a`).forEach(dayLink => {
    dayLink.addEventListener('click', handleSelectDate)
  })

  // set the default selected day on load
  const selectedDate = document.querySelector(`.${calendarDaySelectedClass}`)?.dataset?.date

  if (selectedDate) {
    document
      .querySelector(`.${calendarDayGroupClass}[data-date='${selectedDate}']`)
      .classList.add(calendarDayGroupActiveClass)
  }
}
