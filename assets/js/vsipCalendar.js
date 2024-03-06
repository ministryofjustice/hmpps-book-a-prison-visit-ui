const calendarDayClass = 'vsip-calendar__day'
const calendarDaySelectedClass = 'vsip-calendar__day--selected'
const calendarDayGroupClass = 'vsip-calendar__day-group'
const calendarDayGroupActiveClass = 'vsip-calendar__day-group--active'

function handleSelectDate(event) {
  event.preventDefault()
  const dateToShow = event.target.parentElement.dataset.date

  // remove highlighted day
  document.querySelector(`.${calendarDaySelectedClass}`).classList.remove(calendarDaySelectedClass)
  
  // hide active form group
  document.querySelector(`.${calendarDayGroupActiveClass}`).classList.remove(calendarDayGroupActiveClass)

  // highlight selected day
  document.querySelector(`.${calendarDayClass}[data-date='${dateToShow}']`).classList.add(calendarDaySelectedClass)

  // show selected day's slots
  const selectedFormGroup = document.querySelector(`.${calendarDayGroupClass}[data-date='${dateToShow}']`)
  selectedFormGroup.classList.add(calendarDayGroupActiveClass)

  // scroll to slots if first input is not in viewport
  const firstSlot = document.getElementById(`date-${dateToShow}`)
  const isFirstSlotInViewport = window.innerHeight <= firstSlot.getBoundingClientRect().bottom
  if (isFirstSlotInViewport) {
    selectedFormGroup.scrollIntoView({ behavior: "smooth"})
  }
  firstSlot.focus()
}

if (document.body.classList.contains('govuk-frontend-supported')) {
  // handle clicks on the calendar days
  document.querySelectorAll(`.${calendarDayClass} a`).forEach(dayLink => {
    dayLink.addEventListener('click', handleSelectDate)
  })


  // set the default selected day on load
  const selectedDate = document.querySelector(`.${calendarDaySelectedClass}`)?.dataset?.date

  if (selectedDate) {
    document.querySelector(`.${calendarDayGroupClass}[data-date='${selectedDate}']`)
      .classList.add(calendarDayGroupActiveClass)
  }
}
